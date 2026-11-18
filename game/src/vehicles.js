// Palma Heat — vehicles: player-stealable cars, traffic, police cruisers, helicopter.
const THREE = window.THREE;
import { TRAFFIC_COLORS } from './config.js';

function lambert(color) { return new THREE.MeshLambertMaterial({ color }); }

export function makeCarMesh(def, opts = {}) {
  const g = new THREE.Group();
  const bodyMat = lambert(def.color);
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x18222e });
  const darkMat = lambert(0x1a1a1e);
  // body: lower slab + cabin + hood/trunk shaping via a second slab
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.62, 4.4), bodyMat);
  body.position.y = 0.62; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.55, 2.2), glassMat);
  cabin.position.set(0, 1.15, -0.25); g.add(cabin);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.22, 1.0), bodyMat);
  hood.position.set(0, 0.86, 1.65); g.add(hood);
  // wheels
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 12);
  const wheels = [];
  for (const [wx, wz] of [[-0.95, 1.45], [0.95, 1.45], [-0.95, -1.45], [0.95, -1.45]]) {
    const w = new THREE.Mesh(wheelGeo, darkMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.36, wz);
    g.add(w); wheels.push(w);
  }
  // headlights + taillights
  const hl = new THREE.MeshBasicMaterial({ color: 0xfff2b0 });
  for (const dx of [-0.7, 0.7]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.1), hl);
    h.position.set(dx, 0.72, 2.22); g.add(h);
  }
  const tl = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  for (const dx of [-0.7, 0.7]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.1), tl);
    t.position.set(dx, 0.72, -2.22); g.add(t);
  }
  if (opts.police) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.5), lambert(0x111111));
    bar.position.set(0, 1.5, -0.25); g.add(bar);
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.4), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
    r.position.set(-0.3, 1.62, -0.25); g.add(r);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.2, 0.4), new THREE.MeshBasicMaterial({ color: 0x2244ff }));
    b.position.set(0.3, 1.62, -0.25); g.add(b);
    g.userData.beaconR = r; g.userData.beaconB = b;
    // white doors with a stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.2, 2.6), lambert(0x111111));
    stripe.position.set(0, 0.62, 0); g.add(stripe);
  }
  if (opts.taxi) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.4), new THREE.MeshBasicMaterial({ color: 0xffd23e }));
    sign.position.set(0, 1.52, -0.25); g.add(sign);
  }
  g.userData.wheels = wheels;
  return g;
}

export function makeTrafficCar(rng) {
  const def = { color: TRAFFIC_COLORS[Math.floor(rng() * TRAFFIC_COLORS.length)], top: 26 + rng() * 8 };
  const mesh = makeCarMesh(def, { taxi: rng() < 0.12 });
  return { def, mesh, speed: 0, lane: 0, axis: 'x', dir: 1, pos: 0, fixed: 0 };
}

export function makePoliceCar() {
  const def = { color: 0xf0f0f0, top: 54, accel: 30, grip: 2.6, name: 'Patrol' };
  const mesh = makeCarMesh(def, { police: true });
  return { def, mesh, speed: 0, state: 'chase', ramCooldown: 0, angle: 0 };
}

// Helicopter: readable body + tail + main rotor + tail rotor + searchlight cone.
// The cone is deliberately narrow and dim so it never whites out the buildings.
export function makeHelicopter() {
  const g = new THREE.Group();
  const bodyMat = lambert(0x223344);
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), bodyMat);
  body.scale.set(1, 0.85, 1.5);
  g.add(body);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(1.0, 10, 8), new THREE.MeshLambertMaterial({ color: 0x9fd8ff }));
  glass.scale.set(1, 0.7, 1);
  glass.position.set(0, 0.25, 1.35);
  g.add(glass);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 4.6), bodyMat);
  tail.position.set(0, 0.35, -3.4); g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.5, 0.9), bodyMat);
  fin.position.set(0, 0.9, -5.4); g.add(fin);
  const skidMat = lambert(0x111111);
  for (const dx of [-0.9, 0.9]) {
    const skid = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 3.4), skidMat);
    skid.position.set(dx, -1.25, 0.4); g.add(skid);
  }
  // main rotor: two long blades + hub
  const rotor = new THREE.Group();
  const bladeMat = lambert(0x14141a);
  for (const dx of [-3.4, 3.4]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 0.5), bladeMat);
    blade.position.x = dx; rotor.add(blade);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 8), skidMat);
  rotor.add(hub);
  rotor.position.y = 1.55;
  g.add(rotor);
  // tail rotor
  const tailRotor = new THREE.Group();
  for (const dy of [-0.7, 0.7]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.3), bladeMat);
    blade.position.y = dy; tailRotor.add(blade);
  }
  tailRotor.position.set(0.35, 0.9, -5.3);
  g.add(tailRotor);
  // searchlight: narrow cone, low opacity, additive — never a white wall.
  // ConeGeometry apex is at +Y: apex sits at the heli, base opens on the ground.
  const coneGeo = new THREE.ConeGeometry(3.2, 26, 20, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfff2b0, transparent: true, opacity: 0.13,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.y = -14.2;
  g.add(cone);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(3.0, 20), new THREE.MeshBasicMaterial({
    color: 0xfff2b0, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  spot.rotation.x = -Math.PI / 2;
  spot.position.y = -26.5;
  g.add(spot);
  g.userData.rotor = rotor;
  g.userData.tailRotor = tailRotor;
  g.userData.cone = cone;
  g.userData.spot = spot;
  return g;
}
