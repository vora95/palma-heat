// Palma Heat — pedestrians: simple varied figures walking the sidewalks.
const THREE = window.THREE;

const SHIRTS = [0xd7263d, 0x2e86ff, 0x18c8a0, 0xf5d90a, 0xff8c1a, 0x9a7bb8, 0xe8e8e8, 0x3a3a44];
const SKINS = [0xc98d64, 0x8a5a3b, 0xe8b48c, 0xa06a42, 0xd9a06f];
const PANTS = [0x2c3e50, 0x3a2a22, 0x1e2a38, 0x4a4038, 0x5a5a6a];

export function makePedestrian(rng) {
  const g = new THREE.Group();
  const shirt = SHIRTS[Math.floor(rng() * SHIRTS.length)];
  const skin = SKINS[Math.floor(rng() * SKINS.length)];
  const pants = PANTS[Math.floor(rng() * PANTS.length)];
  const scale = 0.92 + rng() * 0.18;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.75, 0.3), new THREE.MeshLambertMaterial({ color: shirt }));
  body.position.y = 1.05; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), new THREE.MeshLambertMaterial({ color: skin }));
  head.position.y = 1.68; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 10), new THREE.MeshLambertMaterial({ color: 0x1c1210 }));
  hair.position.y = 1.78; hair.scale.set(1, 0.7, 1); g.add(hair);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.68, 0.22), new THREE.MeshLambertMaterial({ color: pants }));
  legL.position.set(-0.14, 0.34, 0); g.add(legL);
  const legR = legL.clone(); legR.position.x = 0.14; g.add(legR);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.18), new THREE.MeshLambertMaterial({ color: shirt }));
  armL.position.set(-0.36, 1.05, 0); g.add(armL);
  const armR = armL.clone(); armR.position.x = 0.36; g.add(armR);
  g.scale.setScalar(scale);
  g.userData = { legL, legR, armL, armR, walkPhase: rng() * Math.PI * 2 };
  return g;
}

// A pedestrian walks back and forth along one sidewalk segment.
export function makePed(rng, x0, z0, x1, z1) {
  const mesh = makePedestrian(rng);
  const speed = 1.0 + rng() * 0.9;
  return {
    mesh, speed, x0, z0, x1, z1,
    t: rng(), dir: rng() < 0.5 ? 1 : -1,
    down: false, downTimer: 0,
  };
}

export function updatePed(p, dt, time) {
  if (p.down) {
    p.downTimer -= dt;
    p.mesh.rotation.z = Math.PI / 2 * 0.9;
    if (p.downTimer <= 0) { p.down = false; p.mesh.rotation.z = 0; }
    return;
  }
  p.t += (p.dir * p.speed * dt) / 30;
  if (p.t > 1) { p.t = 1; p.dir = -1; }
  if (p.t < 0) { p.t = 0; p.dir = 1; }
  const x = p.x0 + (p.x1 - p.x0) * p.t;
  const z = p.z0 + (p.z1 - p.z0) * p.t;
  p.mesh.position.set(x, 0, z);
  const ang = Math.atan2(p.x1 - p.x0, p.z1 - p.z0) * p.dir;
  p.mesh.rotation.y = ang;
  const ph = time * 7 + p.mesh.userData.walkPhase;
  const swing = Math.sin(ph) * 0.5;
  p.mesh.userData.legL.rotation.x = swing;
  p.mesh.userData.legR.rotation.x = -swing;
  p.mesh.userData.armL.rotation.x = -swing * 0.7;
  p.mesh.userData.armR.rotation.x = swing * 0.7;
}
