// Palma Heat — the city of Palma: grid streets, varied buildings, beach, pier,
// plaza with fountain, ferris wheel, warehouse lot, casino, garage.
const THREE = window.THREE;
import { CITY, mulberry32 } from './config.js';
import { facadeTextures, roadTexture, sidewalkTexture, pierTexture, sandTexture, waterTexture, awningTexture } from './textures.js';

const ROAD_Y = 0.02;
const SIDE_Y = 0.06;

function box(w, h, d, mat, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.y = ry;
  m.castShadow = false; m.receiveShadow = false;
  return m;
}

export function buildWorld(scene, seed) {
  const rng = mulberry32(seed);
  const colliders = [];
  const group = new THREE.Group();
  scene.add(group);

  // ---- sky, sun, light, fog ----
  scene.background = new THREE.Color(0xf0784a);
  scene.fog = new THREE.Fog(0xe87a4e, 90, 420);
  const hemi = new THREE.HemisphereLight(0xffd9a0, 0x3a2a4a, 0.95);
  scene.add(hemi);
  const sunLight = new THREE.DirectionalLight(0xffb060, 1.6);
  sunLight.position.set(-160, 70, 30);
  scene.add(sunLight);
  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(26, 40),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, fog: false }),
  );
  sunDisc.position.set(-420, 52, 10);
  sunDisc.lookAt(0, 20, 0);
  scene.add(sunDisc);
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(60, 40),
    new THREE.MeshBasicMaterial({ color: 0xff9a3d, transparent: true, opacity: 0.35, fog: false }),
  );
  glow.position.set(-425, 52, 10);
  glow.lookAt(0, 20, 0);
  scene.add(glow);

  // ---- ground base ----
  const base = new THREE.Mesh(
    new THREE.PlaneGeometry(520, 520),
    new THREE.MeshLambertMaterial({ color: 0x3a3444 }),
  );
  base.rotation.x = -Math.PI / 2; base.position.set(0, 0, 10);
  group.add(base);

  // ---- beach sand (south of the z=60 road) + ocean (beyond) ----
  const sandTex = sandTexture();
  sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping; sandTex.repeat.set(10, 4);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(260, 58), new THREE.MeshLambertMaterial({ map: sandTex }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.04, 93.5);
  group.add(sand);
  const waterTex = waterTexture();
  waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping; waterTex.repeat.set(8, 4);
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(520, 140), new THREE.MeshLambertMaterial({ map: waterTex }));
  ocean.rotation.x = -Math.PI / 2; ocean.position.set(0, 0.03, 192);
  group.add(ocean);

  // ---- roads (grid strips) ----
  const roadTex = roadTexture();
  roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
  const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
  const roadLines = [];
  for (let i = 0; i <= CITY.blocks; i++) {
    const c = -CITY.half + i * CITY.block;
    roadLines.push(c);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(CITY.road, CITY.half * 2 + 20), roadMat);
    v.rotation.x = -Math.PI / 2; v.position.set(c, ROAD_Y, 0);
    group.add(v);
    const h = new THREE.Mesh(new THREE.PlaneGeometry(CITY.half * 2 + 20, CITY.road), roadMat);
    h.rotation.x = -Math.PI / 2; h.position.set(0, ROAD_Y, c);
    group.add(h);
  }

  // ---- sidewalks + buildings, block by block ----
  const sideTex = sidewalkTexture();
  sideTex.wrapS = sideTex.wrapT = THREE.RepeatWrapping; sideTex.repeat.set(4, 4);
  const sideMat = new THREE.MeshLambertMaterial({ map: sideTex });
  const facades = facadeTextures(rng);
  const facadeMats = facades.map((t) => new THREE.MeshLambertMaterial({ map: t }));
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x4a4038 });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x2c2833 });
  const awnMats = [
    new THREE.MeshLambertMaterial({ map: awningTexture('#d7263d', '#f5ead6'), side: THREE.DoubleSide }),
    new THREE.MeshLambertMaterial({ map: awningTexture('#2e86ff', '#f5ead6'), side: THREE.DoubleSide }),
    new THREE.MeshLambertMaterial({ map: awningTexture('#18c8a0', '#f5ead6'), side: THREE.DoubleSide }),
  ];

  const plazaBlock = { i: 0, j: 7 };       // south-west corner -> Plaza Palma
  const warehouseBlock = { i: 0, j: 2 };   // west side -> warehouse lot (mission 5)
  const casinoBlock = { i: 7, j: 4 };      // east side -> casino
  const garageBlock = { i: 6, j: 0 };      // north-east -> Rico's garage

  function addCollider(x0, z0, x1, z1) {
    colliders.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1) });
  }

  function rooftopProps(g, bx, bz, bw, bd, topY, r) {
    // AC boxes, water tank, antenna — rooftops are not flat slabs.
    const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const px = bx + (r() - 0.5) * (bw - 4);
      const pz = bz + (r() - 0.5) * (bd - 4);
      if (r() < 0.4) {
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.2, 10), new THREE.MeshLambertMaterial({ color: 0x8a7a6a }));
        tank.position.set(px, topY + 1.1, pz); g.add(tank);
      } else {
        g.add(box(2.2, 1.1, 1.6, darkMat, px, topY + 0.55, pz, r() * Math.PI));
      }
    }
    if (r() < 0.5) {
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6, 6), darkMat);
      ant.position.set(bx + (r() - 0.5) * bw * 0.5, topY + 3, bz + (r() - 0.5) * bd * 0.5);
      g.add(ant);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff4444 }));
      tip.position.set(ant.position.x, topY + 6.1, ant.position.z);
      g.add(tip);
    }
  }

  for (let i = 0; i < CITY.blocks; i++) {
    for (let j = 0; j < CITY.blocks; j++) {
      const cx = -CITY.half + CITY.block / 2 + i * CITY.block;
      const cz = -CITY.half + CITY.block / 2 + j * CITY.block;
      const isPlaza = i === plazaBlock.i && j === plazaBlock.j;
      const isWarehouse = i === warehouseBlock.i && j === warehouseBlock.j;
      const isCasino = i === casinoBlock.i && j === casinoBlock.j;
      const isGarage = i === garageBlock.i && j === garageBlock.j;
      if (isPlaza || isWarehouse || isCasino || isGarage) continue;
      // sidewalk slab for the block
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(CITY.block - CITY.road + 2, CITY.block - CITY.road + 2), sideMat);
      sw.rotation.x = -Math.PI / 2; sw.position.set(cx, SIDE_Y, cz);
      group.add(sw);
      // 1-3 buildings per block, varied footprint and height
      const count = 1 + Math.floor(rng() * 3);
      for (let b = 0; b < count; b++) {
        const bw = 7 + rng() * 9, bd = 7 + rng() * 9;
        const bx = cx + (rng() - 0.5) * (CITY.block - CITY.road - bw - 2);
        const bz = cz + (rng() - 0.5) * (CITY.block - CITY.road - bd - 2);
        const h = 8 + rng() * rng() * 26;
        const mat = facadeMats[Math.floor(rng() * facadeMats.length)];
        const bld = box(bw, h, bd, mat, bx, h / 2, bz, rng() < 0.3 ? Math.PI / 2 : 0);
        group.add(bld);
        // roof slab slightly overhanging
        group.add(box(bw + 0.6, 0.5, bd + 0.6, roofMat, bx, h + 0.25, bz));
        // setback upper floor on tall buildings
        if (h > 20 && rng() < 0.6) {
          const uw = bw * 0.55, ud = bd * 0.55, uh = 5 + rng() * 5;
          group.add(box(uw, uh, ud, facadeMats[Math.floor(rng() * facadeMats.length)], bx, h + 0.5 + uh / 2, bz));
          group.add(box(uw + 0.5, 0.4, ud + 0.5, roofMat, bx, h + 0.5 + uh + 0.2, bz));
          rooftopProps(group, bx, bz, uw, ud, h + 0.5 + uh + 0.4, rng);
        } else {
          rooftopProps(group, bx, bz, bw, bd, h + 0.5, rng);
        }
        // striped awning over the shopfront on some buildings
        if (rng() < 0.45) {
          const aw = new THREE.Mesh(new THREE.PlaneGeometry(bw * 0.7, 2.6), awnMats[Math.floor(rng() * awnMats.length)]);
          aw.position.set(bx, 3.4, bz + bd / 2 + 0.9);
          aw.rotation.x = -0.5;
          group.add(aw);
          const aw2 = aw.clone(); aw2.position.z = bz - bd / 2 - 0.9; aw2.rotation.y = Math.PI; aw2.rotation.x = -0.5;
          if (rng() < 0.5) group.add(aw2);
        }
        addCollider(bx - bw / 2, bz - bd / 2, bx + bw / 2, bz + bd / 2);
      }
    }
  }

  // ---- Plaza Palma (south-west corner block): fountain, benches, palms ----
  {
    const px = -CITY.half + CITY.block / 2 + plazaBlock.i * CITY.block;
    const pz = -CITY.half + CITY.block / 2 + plazaBlock.j * CITY.block;
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(CITY.block - CITY.road + 2, CITY.block - CITY.road + 2), sideMat);
    sw.rotation.x = -Math.PI / 2; sw.position.set(px, SIDE_Y, pz);
    group.add(sw);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.6, 1.1, 20), new THREE.MeshLambertMaterial({ color: 0xcfc4ae }));
    rim.position.set(px, 0.55, pz); group.add(rim);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(4.7, 4.7, 0.5, 20), new THREE.MeshLambertMaterial({ color: 0x3a9ac2 }));
    water.position.set(px, 0.9, pz); group.add(water);
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, 2.2, 10), new THREE.MeshLambertMaterial({ color: 0xe8dcc2 }));
    jet.position.set(px, 1.8, pz); group.add(jet);
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), new THREE.MeshLambertMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.8 }));
    drop.position.set(px, 3.2, pz); group.add(drop);
    addCollider(px - 5.6, pz - 5.6, px + 5.6, pz + 5.6);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      group.add(box(2.4, 0.5, 0.9, new THREE.MeshLambertMaterial({ color: 0x6a4a2a }), px + Math.cos(a) * 8, 0.45, pz + Math.sin(a) * 8, -a));
    }
  }

  // ---- Warehouse lot (mission 5): two sheds, crates, forklift, fence ----
  {
    const wx = -CITY.half + CITY.block / 2 + warehouseBlock.i * CITY.block;
    const wz = -CITY.half + CITY.block / 2 + warehouseBlock.j * CITY.block;
    const shedMat = new THREE.MeshLambertMaterial({ color: 0x9a8a7a });
    const shed1 = box(16, 7, 10, shedMat, wx - 2, 3.5, wz - 6);
    group.add(shed1);
    const roof1 = box(17, 0.6, 11, darkMat, wx - 2, 7.3, wz - 6);
    group.add(roof1);
    const doorMat = new THREE.MeshLambertMaterial({ color: 0xc8a04a });
    group.add(box(5, 5.4, 0.4, doorMat, wx - 2, 2.7, wz - 0.9));
    const shed2 = box(10, 5.5, 8, new THREE.MeshLambertMaterial({ color: 0x7a6a5a }), wx + 4, 2.75, wz + 7);
    group.add(shed2);
    addCollider(wx - 10, wz - 11, wx + 6, wz - 1);
    addCollider(wx - 1, wz + 3, wx + 9, wz + 11);
    // concrete apron so the yard reads as a working lot, not empty asphalt
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshLambertMaterial({ color: 0x8a8578 }));
    apron.rotation.x = -Math.PI / 2; apron.position.set(wx, 0.05, wz);
    group.add(apron);
    // crates stacked in the open yard — cover, not empty asphalt
    const crateMat = new THREE.MeshLambertMaterial({ color: 0xa8763e });
    const crateMat2 = new THREE.MeshLambertMaterial({ color: 0x7a5a34 });
    const crateSpots = [
      [-14, 6, 2.2], [-11.5, 6, 2.2], [-12.8, 6, 4.4], [2, 8, 1.8], [4.2, 8, 1.8], [3.1, 8, 3.6],
      [10, 2, 2.2], [12.4, 2, 2.2], [-6, -2, 1.8], [-3.8, -2, 1.8],
      [7, -6, 2.0], [9.2, -6, 2.0], [8.1, -6, 4.0], [-2, 4, 1.6], [0, 4, 1.6],
    ];
    for (const [dx, dz, s] of crateSpots) {
      const c = box(s, s, s, rng() < 0.5 ? crateMat : crateMat2, wx + dx, s / 2, wz + dz, rng() * 0.6);
      group.add(c);
      addCollider(wx + dx - s / 2, wz + dz - s / 2, wx + dx + s / 2, wz + dz + s / 2);
    }
    // barrels near the south edge of the yard
    const barrelMat = new THREE.MeshLambertMaterial({ color: 0x3a6a8a });
    for (const [dx, dz] of [[-4, 9], [-2.6, 9], [12, -4]]) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.6, 10), barrelMat);
      b.position.set(wx + dx, 0.8, wz + dz); group.add(b);
      addCollider(wx + dx - 0.7, wz + dz - 0.7, wx + dx + 0.7, wz + dz + 0.7);
    }
    // forklift: body + mast + forks
    const fk = new THREE.Group();
    fk.add(box(2.2, 1.2, 1.4, new THREE.MeshLambertMaterial({ color: 0xe8b800 }), 0, 0.8, 0));
    fk.add(box(0.3, 2.4, 1.2, darkMat, 1.1, 1.4, 0));
    fk.add(box(1.4, 0.12, 0.2, darkMat, 1.8, 0.25, 0.45));
    fk.add(box(1.4, 0.12, 0.2, darkMat, 1.8, 0.25, -0.45));
    fk.position.set(wx + 8, 0, wz - 2); fk.rotation.y = 0.7;
    group.add(fk);
    // "WAREHOUSE 4" painted sign board, facing the yard (south)
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.2), new THREE.MeshBasicMaterial({ color: 0x1a1a22, side: THREE.DoubleSide }));
    sign.position.set(wx - 2, 5.6, wz - 0.85);
    group.add(sign);
  }

  // ---- Casino (Sunset Strip): tall glass + gold sign + awning ----
  {
    const cx = -CITY.half + CITY.block / 2 + casinoBlock.i * CITY.block;
    const cz = -CITY.half + CITY.block / 2 + casinoBlock.j * CITY.block;
    const tower = box(16, 24, 14, facadeMats[1], cx, 12, cz);
    group.add(tower);
    group.add(box(17, 0.6, 15, roofMat, cx, 24.3, cz));
    rooftopProps(group, cx, cz, 16, 14, 24.6, rng);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.6), new THREE.MeshBasicMaterial({ color: 0xffd23e }));
    sign.position.set(cx, 20, cz + 7.2); group.add(sign);
    const aw = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.4), awnMats[0]);
    aw.position.set(cx, 4.2, cz + 7.6); aw.rotation.x = -0.45;
    group.add(aw);
    addCollider(cx - 8, cz - 7, cx + 8, cz + 7);
  }

  // ---- Rico's garage (Old Palma): low shed + "GARAGE" board ----
  {
    const gx = -CITY.half + CITY.block / 2 + garageBlock.i * CITY.block;
    const gz = -CITY.half + CITY.block / 2 + garageBlock.j * CITY.block;
    group.add(box(14, 5, 10, new THREE.MeshLambertMaterial({ color: 0x5a6a7a }), gx, 2.5, gz));
    group.add(box(15, 0.5, 11, darkMat, gx, 5.2, gz));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.8), new THREE.MeshBasicMaterial({ color: 0x2e86ff }));
    sign.position.set(gx, 4.4, gz + 5.2); group.add(sign);
    addCollider(gx - 7, gz - 5, gx + 7, gz + 5);
  }

  // ---- Pier (south, into the ocean): planks, posts, rails, benches, lamps, shack ----
  {
    const px = -40;
    const pierTex = pierTexture();
    pierTex.wrapS = pierTex.wrapT = THREE.RepeatWrapping; pierTex.repeat.set(2, 6);
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(10, 42), new THREE.MeshLambertMaterial({ map: pierTex }));
    deck.rotation.x = -Math.PI / 2; deck.position.set(px, 0.9, 141);
    group.add(deck);
    const postMat = new THREE.MeshLambertMaterial({ color: 0x5a3a22 });
    for (let z = 122; z <= 160; z += 6) {
      for (const dx of [-4.6, 4.6]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 3.4, 8), postMat);
        post.position.set(px + dx, 0.2, z); group.add(post);
      }
    }
    const railMat = new THREE.MeshLambertMaterial({ color: 0x8a6a42 });
    for (const dx of [-4.9, 4.9]) {
      group.add(box(0.18, 0.18, 40, railMat, px + dx, 1.9, 141));
      group.add(box(0.18, 0.18, 40, railMat, px + dx, 1.3, 141));
      for (let z = 122; z <= 160; z += 5) group.add(box(0.15, 1.9, 0.15, railMat, px + dx, 0.95, z));
    }
    for (let z = 126; z <= 156; z += 10) {
      group.add(box(2.2, 0.5, 0.8, new THREE.MeshLambertMaterial({ color: 0x6a4a2a }), px - 3, 1.15, z, 0.1));
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.2, 6), darkMat);
      lamp.position.set(px + 3.6, 2.5, z); group.add(lamp);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
      bulb.position.set(px + 3.6, 4.2, z); group.add(bulb);
    }
    // shack at the end + a bait-shop sign
    group.add(box(5, 3.2, 4, new THREE.MeshLambertMaterial({ color: 0x7a9ab0 }), px, 2.5, 158));
    group.add(box(5.6, 0.4, 4.6, darkMat, px, 4.3, 158));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.2), new THREE.MeshBasicMaterial({ color: 0xffd23e }));
    sign.position.set(px, 3.4, 155.9); sign.rotation.y = Math.PI;
    group.add(sign);
    addCollider(px - 5, 120, px + 5, 160);
  }

  // ---- Ferris wheel on the beach (east end) ----
  const ferris = new THREE.Group();
  {
    const fx = 62, fz = 108;
    const legMat = new THREE.MeshLambertMaterial({ color: 0xd8d8d8 });
    const legL = box(0.8, 20, 0.8, legMat, -4, 10, 0); legL.rotation.z = 0.35; ferris.add(legL);
    const legR = box(0.8, 20, 0.8, legMat, 4, 10, 0); legR.rotation.z = -0.35; ferris.add(legR);
    const wheel = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(11, 0.5, 8, 36), new THREE.MeshLambertMaterial({ color: 0xff5a7a }));
    wheel.add(rim);
    for (let k = 0; k < 8; k++) {
      const spoke = box(0.35, 22, 0.35, legMat, 0, 0, 0);
      spoke.rotation.z = (k / 8) * Math.PI;
      wheel.add(spoke);
    }
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const gond = box(2.2, 1.6, 1.6, new THREE.MeshLambertMaterial({ color: [0xffd23e, 0x2e86ff, 0x18c8a0, 0xd7263d][k % 4] }), Math.cos(a) * 11, Math.sin(a) * 11, 0);
      wheel.add(gond);
    }
    const hub = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    wheel.add(hub);
    wheel.position.y = 19;
    ferris.add(wheel);
    ferris.position.set(fx, 0, fz);
    ferris.userData.wheel = wheel;
    group.add(ferris);
    addCollider(fx - 6, fz - 2, fx + 6, fz + 2);
  }

  // ---- streetlights along main roads ----
  const lampMat = darkMat;
  for (const c of roadLines) {
    for (let t = -105; t <= 105; t += 30) {
      if (Math.abs(t) > 118) continue;
      if (rng() < 0.25) continue;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 5.4, 6), lampMat);
      pole.position.set(c + 5.2, 2.7, t); group.add(pole);
      const arm = box(1.6, 0.12, 0.12, lampMat, c + 4.4, 5.35, t);
      group.add(arm);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
      bulb.position.set(c + 3.7, 5.3, t); group.add(bulb);
    }
  }

  // ---- palm trees along the beach road and plaza ----
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7a5a34 });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e8a4a, side: THREE.DoubleSide });
  function palm(x, z) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.4, 5.5, 7), trunkMat);
    trunk.position.y = 2.75; trunk.rotation.z = (rng() - 0.5) * 0.16; g.add(trunk);
    for (let k = 0; k < 6; k++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.4, 4), leafMat);
      const a = (k / 6) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 1.4, 5.6, Math.sin(a) * 1.4);
      leaf.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
      leaf.scale.set(1, 1, 0.28);
      g.add(leaf);
    }
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshLambertMaterial({ color: 0x6a4a22 }));
    nut.position.y = 5.4; g.add(nut);
    g.position.set(x, 0, z);
    group.add(g);
  }
  for (let x = -110; x <= 110; x += 15) {
    if (rng() < 0.2) continue;
    palm(x + (rng() - 0.5) * 4, 67 + rng() * 3);
    // the south palm row stays clear of the plaza's west end so no trunk
    // ever lands in the plaza camera line
    if (x < -80) continue;
    palm(x + (rng() - 0.5) * 4, 115 - rng() * 3);
  }
  palm(-88, 88); palm(-102, 102); palm(-88, 102);

  // ---- billboards on tall poles beside three intersections ----
  const boardCols = [0xd7263d, 0xffd23e, 0x2e86ff];
  [[-58, -58], [58, 58], [88, -28]].forEach(([bx, bz], k) => {
    const board = new THREE.Mesh(new THREE.PlaneGeometry(11, 3.4), new THREE.MeshBasicMaterial({ color: boardCols[k] }));
    board.position.set(bx, 8.4, bz);
    group.add(board);
    group.add(box(0.5, 7, 0.5, darkMat, bx - 4, 3.5, bz));
    group.add(box(0.5, 7, 0.5, darkMat, bx + 4, 3.5, bz));
    addCollider(bx - 5.5, bz - 0.6, bx + 5.5, bz + 0.6);
  });

  return { colliders, roadLines, ferris, waterTex };
}
