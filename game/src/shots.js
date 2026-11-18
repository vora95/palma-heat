// Palma Heat — deterministic screenshot staging.
// ?shot=cover|drive|mission|walk&seed=N loads the game straight into a
// composed, dense frame. No gameplay input is needed for these shots.
import { CARS } from './config.js';
import { makePoliceCar } from './vehicles.js';
import { makePed } from './people.js';
import { addWanted } from './police.js';
import { openMissionDialogue } from './missions.js';

function putPlayerInCar(G, carDef, x, z, angle, speedKmh) {
  const car = G.spawnCar(carDef, x, z, angle);
  car.condition = 86;
  G.player.car = car;
  G.player.x = x; G.player.z = z;
  G.player.angle = angle;
  G.player.speed = speedKmh / 3.6;
  G.player.onFoot = false;
  if (G.shotMode) G.stagedSpeed = speedKmh / 3.6;
  return car;
}

function putPlayerOnFoot(G, x, z, angle) {
  G.player.x = x; G.player.z = z;
  G.player.angle = angle;
  G.player.car = null;
  G.player.speed = 0;
  G.player.onFoot = true;
  G.player.mesh.position.set(x, 0, z);
  G.player.mesh.rotation.y = angle;
  G.player.mesh.visible = true;
}

function placePolice(G, spots) {
  for (const [x, z, angle] of spots) {
    const car = makePoliceCar();
    car.mesh.position.set(x, 0, z);
    car.angle = angle;
    car.mesh.rotation.y = angle;
    car.speed = 22;
    G.scene.add(car.mesh);
    G.police.cars.push(car);
  }
}

export function stageShot(G, name) {
  const rng = G.rng;
  G.clockMin = 18 * 60 + 42; // golden hour, sun low in the west
  G.shotCam = null;
  if (name === 'cover') {
    // Chase-cam behind the Cometa GT heading WEST on the beach road
    // (z=60) into the sunset: sun disc ahead in frame, two cruisers on
    // the open road in the centre (never under the dialogue box on the
    // right), helicopter cone overhead, Lucía talking.
    putPlayerInCar(G, CARS[0], -40, 60, -Math.PI / 2, 94);
    addWanted(G.police, 4, 'cover');
    // pin the helicopter low and ahead on the road so it sits inside the
    // composed frame with its cone sweeping back onto the player
    G.police.heliFixed = { x: -72, y: 15, z: 56 };
    placePolice(G, [
      [-62, 57.6, -Math.PI / 2],  // ahead-left, fully visible centre-left
      [-16, 62.4, -Math.PI / 2],  // behind-right, clear of the dialogue box
    ]);
    G.police.heliAngle = 2.4;
    openMissionDialogue(G.missions, 1);
    document.getElementById('objective-text').textContent =
      'Kabur dari kejaran polisi — bawa paket ke dermaga.';
  } else if (name === 'drive') {
    // Halcón RS flat out east on the beach road, traffic in the same lanes,
    // city ahead and the ocean to the right.
    putPlayerInCar(G, CARS[4], 40, 60, Math.PI / 2, 118);
    G.police.wanted = 0;
    G.spawnTrafficNear(58, 60, 3);
    G.spawnTrafficNear(22, 90, 2);
  } else if (name === 'mission') {
    // On foot at the yard's south-east corner, facing north-west across
    // the lot, from an elevated camera: the sheds read as rooftops and
    // the crates, forklift, barrels and three guards fill the yard —
    // a ground camera here only ever sees a shed wall.
    putPlayerOnFoot(G, -93, -33, -2.31);
    G.shotCam = { dist: 20, height: 12 };
    G.weapon = 2; // SMG
    addWanted(G.police, 1, 'mission');
    placePolice(G, [[-70, -58, Math.PI * 0.6]]);
    const guards = [
      [-99, -38, -96, -38], [-112, -48, -112, -44], [-92, -50, -88, -50],
    ];
    for (const [x0, z0, x1, z1] of guards) {
      const p = makePed(rng, x0, z0, x1, z1);
      G.scene.add(p.mesh);
      G.peds.push(p);
    }
    document.getElementById('objective-text').textContent =
      'Amankan gudang 4: kalahkan 3 penjaga, ambil kargo.';
  } else if (name === 'walk') {
    // On foot at Plaza Palma, facing the fountain with the ferris wheel
    // behind it: palms, pedestrians and the beach road in frame. The
    // player stands clear of the mission beacon so it never dominates.
    putPlayerOnFoot(G, -96, 112, -2.23);
    G.police.wanted = 0;
    const walkers = [
      [-100, 98, -92, 98], [-108, 100, -100, 106], [-96, 104, -104, 110],
      [-110, 92, -102, 92], [-94, 96, -88, 100], [-106, 108, -98, 112],
    ];
    for (const [x0, z0, x1, z1] of walkers) {
      const p = makePed(rng, x0, z0, x1, z1);
      G.scene.add(p.mesh);
      G.peds.push(p);
    }
    G.spawnTrafficNear(-90, 60, 3);
  }
  G.shotMode = true;
}
