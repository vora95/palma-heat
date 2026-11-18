// Palma Heat — wanted level, police response, helicopter pursuit.
// Wanted 0-5. Police chase, ram and set roadblocks; the helicopter joins at wanted 3+.
const THREE = window.THREE;
import { makePoliceCar, makeHelicopter } from './vehicles.js';
import { clamp, dist2 } from './config.js';

const UNIT_NAMES = ['Unit 12 — Vega', 'Unit 7 — Ramos', 'Unit 21 — Costa', 'Unit 4 — Luna', 'Unit 9 — Soto', 'Unit 15 — Marín'];

export function createPolice(scene) {
  return {
    wanted: 0,
    heat: 0,              // continuous heat, decays when unseen
    cars: [],             // active police cars
    heli: null,           // helicopter mesh (null until wanted >= 3)
    heliAngle: 0,
    spawnTimer: 0,
    roadblock: null,      // {x, z, axis} or null
    roadblockTimer: 0,
    sirenPhase: 0,
    scene,
  };
}

export function addWanted(pol, amount, reason) {
  pol.wanted = clamp(pol.wanted + amount, 0, 5);
  pol.heat = clamp(pol.heat + amount * 20, 0, 100);
  if (pol.wanted >= 3 && !pol.heli) {
    pol.heli = makeHelicopter();
    pol.scene.add(pol.heli);
  }
  return reason;
}

export function policeUnits(pol, px, pz) {
  return pol.cars.map((c, i) => {
    const d = Math.sqrt(dist2(c.mesh.position.x, c.mesh.position.z, px, pz));
    const status = c.state === 'ram' ? 'RAMMING' : c.state === 'block' ? 'ROADBLOCK' : 'IN PURSUIT';
    return { name: UNIT_NAMES[i % UNIT_NAMES.length], dist: Math.round(d), status };
  });
}

function spawnPoliceCar(pol, px, pz, rng) {
  const car = makePoliceCar();
  const a = rng() * Math.PI * 2;
  const r = 34 + rng() * 14;
  car.mesh.position.set(px + Math.cos(a) * r, 0, pz + Math.sin(a) * r);
  pol.scene.add(car.mesh);
  pol.cars.push(car);
  return car;
}

function removePoliceCar(pol, car) {
  pol.scene.remove(car.mesh);
  pol.cars = pol.cars.filter((c) => c !== car);
}

export function updatePolice(pol, dt, px, pz, playerSpeed, rng, time, playerAngle = 0) {
  // heat decay when wanted but no recent crime
  pol.heat = Math.max(0, pol.heat - dt * 1.1);
  if (pol.wanted > 0 && pol.heat <= 0.5) {
    pol.wanted = Math.max(0, pol.wanted - 1);
    pol.heat = pol.wanted > 0 ? 60 : 0;
  }
  if (pol.wanted >= 3 && !pol.heli) {
    pol.heli = makeHelicopter();
    pol.scene.add(pol.heli);
  }
  if (pol.wanted < 3 && pol.heli) {
    pol.scene.remove(pol.heli);
    pol.heli = null;
  }
  // spawn to match wanted level (1 car per star, max 4)
  const want = Math.min(4, pol.wanted);
  pol.spawnTimer -= dt;
  if (pol.cars.length < want && pol.spawnTimer <= 0) {
    spawnPoliceCar(pol, px, pz, rng);
    pol.spawnTimer = 2.5;
  }
  while (pol.cars.length > want) removePoliceCar(pol, pol.cars[pol.cars.length - 1]);

  // roadblock at wanted 4+: a parked cruiser across the road ahead of the
  // player, on the player's own line of travel — never off-road
  pol.roadblockTimer -= dt;
  if (pol.wanted >= 4 && !pol.roadblock && pol.roadblockTimer <= 0) {
    const car = pol.cars[0];
    if (car) {
      car.state = 'block';
      pol.roadblock = {
        x: px + Math.sin(playerAngle) * 30,
        z: pz + Math.cos(playerAngle) * 30,
      };
      pol.roadblockTimer = 18;
    }
  }
  if (pol.roadblock && pol.wanted < 4) { pol.roadblock = null; }

  // chase / ram behaviour
  for (const car of pol.cars) {
    const m = car.mesh;
    const dx = px - m.position.x, dz = pz - m.position.z;
    const d = Math.sqrt(dx * dx + dz * dz) || 1;
    const targetAngle = Math.atan2(dx, dz);
    let da = targetAngle - car.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    const steer = clamp(da * 2.2, -1.6, 1.6);
    car.angle += steer * dt * clamp(car.speed / 8, 0.3, 1);
    const top = car.def.top * (car.state === 'ram' ? 1.08 : 1);
    car.speed = clamp(car.speed + (car.state === 'block' ? -20 : 16) * dt, 0, top);
    if (car.state === 'block' && pol.roadblock) {
      // park across the road at the block point
      const bx = pol.roadblock.x - m.position.x, bz = pol.roadblock.z - m.position.z;
      const bd = Math.sqrt(bx * bx + bz * bz);
      if (bd > 2) {
        m.position.x += (bx / bd) * car.speed * dt * 0.5;
        m.position.z += (bz / bd) * car.speed * dt * 0.5;
      }
      car.speed = Math.max(0, car.speed - 20 * dt);
      m.rotation.y = Math.PI / 2;
    } else {
      m.position.x += Math.sin(car.angle) * car.speed * dt;
      m.position.z += Math.cos(car.angle) * car.speed * dt;
      m.rotation.y = car.angle;
      // ram: when close and fast, lunge at the player
      if (d < 7 && car.speed > 24) car.state = 'ram';
      if (car.state === 'ram' && d > 12) car.state = 'chase';
    }
    // wheels spin + beacon flash
    const spin = car.speed * dt * 2.4;
    for (const w of m.userData.wheels) w.rotation.x += spin;
    const blink = Math.sin(time * 14) > 0;
    if (m.userData.beaconR) m.userData.beaconR.visible = blink;
    if (m.userData.beaconB) m.userData.beaconB.visible = !blink;
    // if hopelessly far, respawn closer
    if (d > 110) {
      const a = rng() * Math.PI * 2;
      m.position.set(px + Math.cos(a) * 40, 0, pz + Math.sin(a) * 40);
    }
  }

  // helicopter: circle above the player, searchlight cone follows.
  // A staged shot may pin the helicopter to a fixed spot instead
  // (heliFixed) so it sits inside the composed frame.
  if (pol.heli) {
    let hx, hz, hy;
    if (pol.heliFixed) {
      hx = pol.heliFixed.x; hy = pol.heliFixed.y; hz = pol.heliFixed.z;
    } else {
      pol.heliAngle += dt * 0.55;
      hx = px + Math.cos(pol.heliAngle) * 16;
      hz = pz + Math.sin(pol.heliAngle) * 16;
      hy = 30;
    }
    pol.heli.position.set(hx, hy, hz);
    pol.heli.rotation.y = -pol.heliAngle;
    pol.heli.userData.rotor.rotation.y += dt * 22;
    pol.heli.userData.tailRotor.rotation.x += dt * 30;
    // Searchlight: a beam whose apex sits at the heli and whose base lands
    // on the ground over the player. The cone is stretched to the exact
    // heli-to-player distance so it always reaches the ground.
    const ox = px - hx, oz = pz - hz;
    const beamLen = Math.sqrt(ox * ox + hy * hy + oz * oz);
    const cone = pol.heli.userData.cone;
    cone.position.set(ox / 2, -hy / 2, oz / 2);
    cone.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(-ox, hy, -oz).normalize(),
    );
    cone.scale.set(1, beamLen / 26, 1);
    pol.heli.userData.spot.position.set(ox, 0.15 - hy, oz);
  }
  pol.sirenPhase += dt;
}
