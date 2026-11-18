// Palma Heat — main: renderer, loop, player, driving, combat, missions,
// traffic, autosave and screenshot staging. Written fresh in this session.
const THREE = window.THREE;
import { CITY, CARS, WEAPONS, MISSIONS, mulberry32, clamp, dist2 } from './config.js';
import { buildWorld } from './world.js';
import { makeCarMesh, makeTrafficCar } from './vehicles.js';
import { makePed, updatePed } from './people.js';
import { createPolice, addWanted, updatePolice } from './police.js';
import { createMissions, currentMission, missionTarget, openMissionDialogue, advanceDialogue, completeMission, hideDialogue, showToast } from './missions.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { updateHud } from './hud.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(location.search);
const SEED = parseInt(params.get('seed') || '7', 10);
const SHOT = params.get('shot') || null;

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 900);
camera.position.set(0, 8, -20);

const rng = mulberry32(SEED);
const world = buildWorld(scene, SEED);
const colliders = world.colliders;
const audio = createAudio();
const input = createInput();
const police = createPolice(scene);
const missions = createMissions();

// ---------- game state ----------
const G = {
  scene, rng, police, missions, time: 0, clockMin: 18 * 60 + 42, day: 1,
  cash: 1240, xp: 1240, rep: 3, radio: 0, weapon: 0, ammo: 24,
  shotMode: !!SHOT, missionTarget: missionTarget(missions),
  player: null, cars: [], traffic: [], peds: [],
  started: false, paused: false, hudTimer: 0, saveTimer: 0,
  shotFrames: 0,
};
// Read-only handle for smoke tests and debugging (state inspection only).
window.__palma = G;

// ---------- player (on foot) ----------
function makePlayerMesh() {
  const g = new THREE.Group();
  const jacket = new THREE.MeshLambertMaterial({ color: 0xff8c1a });
  const skin = new THREE.MeshLambertMaterial({ color: 0xc98d64 });
  const pants = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.78, 0.32), jacket);
  body.position.y = 1.06; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), skin);
  head.position.y = 1.7; g.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), new THREE.MeshLambertMaterial({ color: 0x1a1a1e }));
  cap.position.y = 1.8; cap.scale.set(1, 0.55, 1); g.add(cap);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.22), pants);
  legL.position.set(-0.15, 0.35, 0); g.add(legL);
  const legR = legL.clone(); legR.position.x = 0.15; g.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.18), jacket);
  armL.position.set(-0.38, 1.06, 0); g.add(armL);
  const armR = armL.clone(); armR.position.x = 0.38; g.add(armR);
  g.userData = { legL, legR, armL, armR, walkPhase: 0 };
  return g;
}

const playerMesh = makePlayerMesh();
scene.add(playerMesh);
G.player = {
  mesh: playerMesh, x: -98, z: 92, angle: 0, speed: 0,
  onFoot: true, car: null, walkPhase: 0, fireCooldown: 0,
};
playerMesh.position.set(-98, 0, 92);

// ---------- stealable cars (parked, named) ----------
const PARK_SPOTS = [
  { def: CARS[0], x: -88, z: 78, a: 0.4 },    // Cometa GT — beach road
  { def: CARS[1], x: 44, z: -58, a: 1.6 },   // Brisa S — downtown
  { def: CARS[2], x: 96, z: -88, a: -0.6 },  // Toro V8 — old palma
  { def: CARS[3], x: -58, z: -88, a: 2.2 },  // Nube Classic — marina
  { def: CARS[4], x: 88, z: -98, a: 0.2 },   // Halcón RS — garage row (mission 2)
];

G.spawnCar = function (def, x, z, angle) {
  const mesh = makeCarMesh(def);
  mesh.position.set(x, 0, z);
  mesh.rotation.y = angle;
  scene.add(mesh);
  const car = { def, mesh, speed: 0, angle, condition: 100, parked: true };
  G.cars.push(car);
  return car;
};
for (const s of PARK_SPOTS) G.spawnCar(s.def, s.x, s.z, s.a);

// ---------- traffic (16 cars on the road grid) ----------
function spawnTrafficCar() {
  const t = makeTrafficCar(rng);
  const axis = rng() < 0.5 ? 'x' : 'z';
  const line = -120 + Math.floor(rng() * 9) * 30;
  t.axis = axis; t.fixed = line + (rng() < 0.5 ? -2.4 : 2.4);
  t.pos = -125 + rng() * 250;
  t.dir = rng() < 0.5 ? 1 : -1;
  t.speed = 9 + rng() * 7;
  scene.add(t.mesh);
  G.traffic.push(t);
  return t;
}
for (let i = 0; i < 16; i++) spawnTrafficCar();

G.spawnTrafficNear = function (x, z, n) {
  for (let i = 0; i < n; i++) {
    const t = spawnTrafficCar();
    t.axis = 'x'; t.fixed = z + (i % 2 ? 2.4 : -2.4);
    t.pos = x + (i - 1) * 14; t.dir = 1;
  }
};

// ---------- pedestrians (44 walking the sidewalks) ----------
function spawnPed() {
  const bx = -105 + Math.floor(rng() * 8) * 30;
  const bz = -105 + Math.floor(rng() * 8) * 30;
  const alongX = rng() < 0.5;
  const off = (rng() < 0.5 ? -1 : 1) * (6.5 + rng() * 4);
  const p = alongX
    ? makePed(rng, bx - 9, bz + off, bx + 9, bz + off)
    : makePed(rng, bx + off, bz - 9, bx + off, bz + 9);
  scene.add(p.mesh);
  G.peds.push(p);
  return p;
}
for (let i = 0; i < 44; i++) spawnPed();

// ---------- mission beacon (slim, subtle — a marker, not a pillar) ----------
const beacon = new THREE.Mesh(
  new THREE.CylinderGeometry(1.3, 1.3, 16, 16, 1, true),
  new THREE.MeshBasicMaterial({ color: 0xffd23e, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
);
beacon.position.set(G.missionTarget[0], 8, G.missionTarget[1]);
scene.add(beacon);
const beaconBase = new THREE.Mesh(
  new THREE.CircleGeometry(2.0, 20),
  new THREE.MeshBasicMaterial({ color: 0xffd23e, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }),
);
beaconBase.rotation.x = -Math.PI / 2;
beaconBase.position.set(G.missionTarget[0], 0.15, G.missionTarget[1]);
scene.add(beaconBase);

// ---------- collision helpers ----------
function collideCircle(x, z, r) {
  let nx = x, nz = z;
  for (const c of colliders) {
    const cx = clamp(x, c.x0, c.x1), cz = clamp(z, c.z0, c.z1);
    const dx = x - cx, dz = z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        nx = cx + (dx / d) * r;
        nz = cz + (dz / d) * r;
      } else {
        // centre inside the box: push out along the smallest penetration axis
        const pl = x - c.x0, pr = c.x1 - x, pt = z - c.z0, pb = c.z1 - z;
        const m = Math.min(pl, pr, pt, pb);
        if (m === pl) nx = c.x0 - r; else if (m === pr) nx = c.x1 + r;
        else if (m === pt) nz = c.z0 - r; else nz = c.z1 + r;
      }
      x = nx; z = nz;
    }
  }
  // world bounds + ocean (pier at x -45..-35 is walkable to z 158)
  const onPier = Math.abs(x + 40) <= 5.5;
  x = clamp(x, -132, 132);
  z = clamp(z, -132, onPier ? 158 : 118);
  return [x, z];
}

function carHitBuildings(car, r) {
  const [x, z] = collideCircle(car.mesh.position.x, car.mesh.position.z, r);
  const hit = Math.abs(x - car.mesh.position.x) > 0.01 || Math.abs(z - car.mesh.position.z) > 0.01;
  car.mesh.position.x = x; car.mesh.position.z = z;
  return hit;
}

// ---------- combat ----------
function shoot() {
  const p = G.player;
  if (p.fireCooldown > 0) return;
  const w = WEAPONS[G.weapon];
  if (G.weapon > 0 && G.ammo <= 0) { audio.punch(); return; }
  p.fireCooldown = w.rate;
  if (G.weapon > 0) G.ammo -= 1;
  audio.shot();
  const fx = Math.sin(p.angle), fz = Math.cos(p.angle);
  const ox = p.x, oz = p.z;
  let best = null, bestD = 42;
  const consider = (x, z, obj, kind) => {
    const dx = x - ox, dz = z - oz;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d > 42 || d < 0.5) return;
    const dot = (dx * fx + dz * fz) / d;
    if (dot < 0.94) return;
    if (d < bestD) { bestD = d; best = { obj, kind, x, z }; }
  };
  for (const ped of G.peds) if (!ped.down) consider(ped.mesh.position.x, ped.mesh.position.z, ped, 'ped');
  for (const car of police.cars) consider(car.mesh.position.x, car.mesh.position.z, car, 'cop');
  const endX = ox + fx * bestD, endZ = oz + fz * bestD;
  const tracer = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(ox, 1.3, oz), new THREE.Vector3(endX, 1.3, endZ)]),
    new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.9 }),
  );
  scene.add(tracer);
  setTimeout(() => scene.remove(tracer), 90);
  if (best) {
    if (best.kind === 'ped') {
      best.obj.down = true; best.obj.downTimer = 6;
      addWanted(police, 1, 'shot ped');
    } else {
      best.obj.def.hitPoints = (best.obj.def.hitPoints || 3) - 1;
      if (best.obj.def.hitPoints <= 0) {
        best.obj.speed = 0;
        best.obj.mesh.userData.disabled = true;
        addWanted(police, 1, 'disabled cruiser');
      } else {
        addWanted(police, 1, 'shot police');
      }
    }
  } else if (police.wanted >= 1 && Math.random() < 0.4) {
    addWanted(police, 1, 'fired weapon');
  }
}

function punch() {
  const p = G.player;
  if (p.fireCooldown > 0) return;
  p.fireCooldown = 0.4;
  audio.punch();
  for (const ped of G.peds) {
    if (ped.down) continue;
    if (dist2(ped.mesh.position.x, ped.mesh.position.z, p.x, p.z) < 4.5) {
      ped.down = true; ped.downTimer = 6;
      addWanted(police, 1, 'assault');
      break;
    }
  }
}

// ---------- save / load ----------
const SAVE_KEY = 'palma-heat-save-v1';
function saveGame() {
  if (G.shotMode) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      cash: G.cash, xp: G.xp, rep: G.rep, mission: missions.index,
      x: G.player.x, z: G.player.z, day: G.day, clockMin: G.clockMin,
    }));
  } catch (e) { /* storage unavailable — play on without saving */ }
}
function loadGame() {
  if (G.shotMode) return;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    G.cash = s.cash ?? G.cash; G.xp = s.xp ?? G.xp; G.rep = s.rep ?? G.rep;
    G.day = s.day ?? 1; G.clockMin = s.clockMin ?? G.clockMin;
    if (typeof s.mission === 'number' && s.mission > 0 && s.mission < MISSIONS.length) {
      missions.index = s.mission;
      G.missionTarget = missionTarget(missions);
      beacon.position.set(G.missionTarget[0], 8, G.missionTarget[1]);
      beaconBase.position.set(G.missionTarget[0], 0.15, G.missionTarget[1]);
      document.getElementById('objective-text').textContent = currentMission(missions).objective;
    }
    if (typeof s.x === 'number') { G.player.x = s.x; G.player.z = s.z; playerMesh.position.set(s.x, 0, s.z); }
  } catch (e) { /* corrupted save — start fresh */ }
}
loadGame();
document.getElementById('objective-text').textContent = currentMission(missions).objective;

// ---------- input actions ----------
renderer.domElement.addEventListener('mousedown', () => {
  if (!G.started || G.paused) return;
  if (missions.active) return;
  if (G.weapon === 0) punch(); else shoot();
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Enter' && !G.started) {
    G.started = true;
    document.getElementById('screen-title').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    audio.ensure(); audio.startEngine();
    return;
  }
  if (e.code === 'KeyP' && G.started) {
    G.paused = !G.paused;
    document.getElementById('screen-pause').style.display = G.paused ? 'flex' : 'none';
    return;
  }
  if (!G.started || G.paused) return;
  if (e.code === 'KeyM') {
    G.radio = (G.radio + 1) % 3;
    audio.toggleRadio();
    return;
  }
  if (e.code.startsWith('Digit')) {
    const n = parseInt(e.code.slice(5), 10) - 1;
    if (n >= 0 && n < WEAPONS.length) {
      G.weapon = n;
      if (n > 0) G.ammo = WEAPONS[n].ammo;
    }
    return;
  }
  if (e.code === 'KeyE') {
    const p = G.player;
    if (missions.active) {
      advanceDialogue(missions, (mission) => completeMission(missions, G));
      return;
    }
    if (p.onFoot) {
      let best = null, bestD = 4.2;
      for (const car of G.cars) {
        const d = Math.sqrt(dist2(car.mesh.position.x, car.mesh.position.z, p.x, p.z));
        if (d < bestD) { bestD = d; best = car; }
      }
      if (best) {
        p.car = best; p.onFoot = false; p.speed = 0;
        best.parked = false;
        playerMesh.visible = false;
        if (best.def.name) {
          addWanted(police, 1, 'stole ' + best.def.name);
          showToast('MOBIL DICURI — ' + best.def.name.toUpperCase(), 'Polisi sudah diberi tahu. Kabur!');
          audio.pickup();
        }
      }
    } else {
      const car = p.car;
      const sx = p.x + Math.cos(p.angle + Math.PI / 2) * 2.4;
      const sz = p.z - Math.sin(p.angle + Math.PI / 2) * 2.4;
      const [ex, ez] = collideCircle(sx, sz, 0.6);
      p.x = ex; p.z = ez;
      p.car = null; p.onFoot = true; p.speed = 0;
      playerMesh.visible = true;
      playerMesh.position.set(ex, 0, ez);
    }
    return;
  }
  if (e.code === 'KeyF' && G.player.onFoot) punch();
});

// ---------- per-frame updates ----------
function updatePlayer(dt) {
  const p = G.player;
  p.fireCooldown = Math.max(0, p.fireCooldown - dt);
  if (p.onFoot) {
    const runMul = input.run ? 1.9 : 1;
    const spd = 5.2 * runMul;
    let mx = 0, mz = 0;
    if (input.up) { mx += Math.sin(p.angle); mz += Math.cos(p.angle); }
    if (input.down) { mx -= Math.sin(p.angle) * 0.6; mz -= Math.cos(p.angle) * 0.6; }
    if (input.left) p.angle += 2.6 * dt;
    if (input.right) p.angle -= 2.6 * dt;
    const len = Math.hypot(mx, mz);
    if (len > 0) {
      p.x += (mx / len) * spd * dt;
      p.z += (mz / len) * spd * dt;
      p.walkPhase += dt * 9 * runMul;
      const u = playerMesh.userData;
      u.legL.rotation.x = Math.sin(p.walkPhase) * 0.6;
      u.legR.rotation.x = -Math.sin(p.walkPhase) * 0.6;
      u.armL.rotation.x = -Math.sin(p.walkPhase) * 0.5;
      u.armR.rotation.x = Math.sin(p.walkPhase) * 0.5;
    }
    [p.x, p.z] = collideCircle(p.x, p.z, 0.55);
    playerMesh.position.set(p.x, 0, p.z);
    playerMesh.rotation.y = p.angle;
    // bumping a pedestrian on foot just shoves them aside
    for (const ped of G.peds) {
      if (ped.down) continue;
      if (dist2(ped.mesh.position.x, ped.mesh.position.z, p.x, p.z) < 1.1) {
        ped.t += (ped.dir > 0 ? -0.06 : 0.06);
      }
    }
  } else {
    const car = p.car;
    const def = car.def;
    const accelIn = input.up ? 1 : input.down ? -0.55 : 0;
    car.speed += accelIn * def.accel * dt;
    car.speed -= car.speed * 0.55 * dt; // drag
    if (input.keys['Space']) car.speed -= car.speed * 2.2 * dt;
    car.speed = clamp(car.speed, -14, def.top);
    // staged screenshots hold their composed speed instead of coasting down
    if (G.shotMode && G.stagedSpeed != null) car.speed = G.stagedSpeed;
    const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
    const steerAuthority = clamp(Math.abs(car.speed) / 10, 0, 1);
    car.angle += steer * def.grip * 0.55 * steerAuthority * dt * Math.sign(car.speed || 1);
    const fx = Math.sin(car.angle), fz = Math.cos(car.angle);
    car.mesh.position.x += fx * car.speed * dt;
    car.mesh.position.z += fz * car.speed * dt;
    if (carHitBuildings(car, 1.7)) {
      car.speed *= 0.45;
      car.condition = Math.max(0, car.condition - 1.5);
      if (car.condition <= 0) {
        showToast('MOBIL RUSAK', 'Cari mobil lain — yang ini sudah tidak jalan.');
        car.speed = 0;
      }
    }
    car.mesh.rotation.y = car.angle;
    const spin = car.speed * dt * 2.2;
    for (const w of car.mesh.userData.wheels) w.rotation.x += spin;
    p.x = car.mesh.position.x; p.z = car.mesh.position.z;
    p.angle = car.angle; p.speed = car.speed;
    // running over pedestrians
    for (const ped of G.peds) {
      if (ped.down) continue;
      if (dist2(ped.mesh.position.x, ped.mesh.position.z, p.x, p.z) < 3.4 && Math.abs(car.speed) > 6) {
        ped.down = true; ped.downTimer = 6;
        car.speed *= 0.82;
        addWanted(police, 1, 'hit pedestrian');
      }
    }
    audio.setEngine(clamp(Math.abs(car.speed) / def.top, 0, 1), true);
  }
}

function updateTraffic(dt) {
  for (const t of G.traffic) {
    // slow down for the player's car ahead in the same lane
    let target = t.speed;
    const p = G.player;
    if (p.car) {
      const along = t.axis === 'x' ? p.x : p.z;
      const across = t.axis === 'x' ? p.z : p.x;
      if (Math.abs(across - t.fixed) < 3 && (along - t.pos) * t.dir > 0 && (along - t.pos) * t.dir < 9) target = 0;
    }
    const cur = t.mesh.userData.curSpeed ?? t.speed;
    const next = cur + (target - cur) * Math.min(1, dt * 2);
    t.mesh.userData.curSpeed = next;
    t.pos += t.dir * next * dt;
    if (t.pos > 128) { t.pos = -128; t.speed = 9 + rng() * 7; }
    if (t.pos < -128) { t.pos = 128; t.speed = 9 + rng() * 7; }
    if (t.axis === 'x') {
      t.mesh.position.set(t.pos, 0, t.fixed);
      t.mesh.rotation.y = t.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      t.mesh.position.set(t.fixed, 0, t.pos);
      t.mesh.rotation.y = t.dir > 0 ? 0 : Math.PI;
    }
    const spin = next * dt * 2.2;
    for (const w of t.mesh.userData.wheels) w.rotation.x += spin;
  }
}

function pointInCollider(x, z, pad) {
  for (const c of colliders) {
    if (x > c.x0 - pad && x < c.x1 + pad && z > c.z0 - pad && z < c.z1 + pad) return true;
  }
  return false;
}

function updateCamera(dt) {
  const p = G.player;
  // a staged shot may override the chase distance/height (e.g. an elevated
  // view over the warehouse yard, where a ground camera only sees walls)
  const dist = G.shotCam ? G.shotCam.dist : (p.onFoot ? 6.5 : 10.5);
  const height = G.shotCam ? G.shotCam.height : (p.onFoot ? 3.0 : 4.6);
  const fx = Math.sin(p.angle), fz = Math.cos(p.angle);
  let tx = p.x - fx * dist, tz = p.z - fz * dist;
  // pull the camera in if a building stands between the player and the camera
  let bestT = 1;
  const steps = 12;
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    if (pointInCollider(p.x + (tx - p.x) * t, p.z + (tz - p.z) * t, 0.7)) { bestT = (s - 1) / steps; break; }
  }
  tx = p.x + (tx - p.x) * bestT;
  tz = p.z + (tz - p.z) * bestT;
  if (G.shotMode) {
    // staged shots: snap straight to the composed position, no slow lerp
    camera.position.set(tx, height, tz);
  } else {
    const k = 1 - Math.exp(-dt * 4.5);
    camera.position.x += (tx - camera.position.x) * k;
    camera.position.y += (height - camera.position.y) * k;
    camera.position.z += (tz - camera.position.z) * k;
  }
  camera.lookAt(p.x + fx * 7, 1.6, p.z + fz * 7);
}

function updateMission(dt) {
  if (missions.done) return;
  const [tx, tz] = missionTarget(missions);
  const d = Math.sqrt(dist2(G.player.x, G.player.z, tx, tz));
  if (d < 7 && !missions.active && !missions._opened) {
    missions._opened = true;
    openMissionDialogue(missions);
  }
  if (d > 12) missions._opened = false;
  beacon.material.opacity = 0.16 + Math.sin(G.time * 3) * 0.06;
}

// ---------- main loop ----------
const clock = new THREE.Clock();
let firstFrame = true;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  G.time += dt;
  const running = G.started && !G.paused;

  if (running || G.shotMode) {
    if (!G.shotMode) G.clockMin += dt / 2.5;
    if (G.clockMin >= 1440) { G.clockMin -= 1440; G.day += 1; }
    updatePlayer(dt);
    updateTraffic(dt);
    for (const p of G.peds) updatePed(p, dt, G.time);
    updatePolice(police, dt, G.player.x, G.player.z, Math.abs(G.player.speed), rng, G.time, G.player.angle);
    updateMission(dt);
    world.ferris.userData.wheel.rotation.z += dt * 0.12;
    world.waterTex.offset.x += dt * 0.008;
    world.waterTex.offset.y += dt * 0.004;
    audio.siren(dt, police.wanted);
    audio.radioTick(dt, G.radio);
    G.hudTimer -= dt;
    if (G.hudTimer <= 0) { G.hudTimer = 0.12; updateHud(G); }
    G.saveTimer -= dt;
    if (G.saveTimer <= 0) { G.saveTimer = 15; saveGame(); }
  }
  updateCamera(dt);
  renderer.render(scene, camera);

  if (G.shotMode) {
    G.shotFrames += 1;
    if (G.shotFrames >= 3) window.__shotReady = true;
  } else if (firstFrame) {
    firstFrame = false;
    window.__shotReady = true;
  }
}

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// shot mode starts immediately, no title screen
if (SHOT) {
  G.started = true;
  document.getElementById('screen-title').style.display = 'none';
  document.getElementById('hud').style.display = 'block';
  stageShot(G, SHOT);
  updateHud(G);
}
frame();
