// Palma Heat — HUD: wanted stars, police response panel, clock, district,
// REP, cash, speed, car, weapons, and the 2D minimap with route + blips.
import { DISTRICTS, WEAPONS, RADIOS } from './config.js';
import { policeUnits } from './police.js';

const STAR_ON = '★';
const STAR_OFF = '☆';

export function districtAt(x, z) {
  for (const d of DISTRICTS) {
    if (x >= d.x0 && x < d.x1 && z >= d.z0 && z < d.z1) return d.name;
  }
  return 'Palma Beach';
}

export function updateHud(G) {
  const pol = G.police;
  // wanted stars
  const stars = document.getElementById('wanted-stars');
  let html = '';
  for (let i = 0; i < 5; i++) {
    html += i < pol.wanted
      ? `<span>${STAR_ON}</span>`
      : `<span class="off">${STAR_OFF}</span>`;
  }
  stars.innerHTML = html;
  // police response panel
  const units = policeUnits(pol, G.player.x, G.player.z);
  const box = document.getElementById('units');
  if (units.length === 0) {
    box.innerHTML = '<div class="unit">No units responding — <span class="st">all clear</span></div>';
  } else {
    box.innerHTML = units.map((u) =>
      `<div class="unit"><b>${u.name}</b> — <span class="dist">${u.dist}m</span> — <span class="st">${u.status}</span></div>`,
    ).join('');
  }
  // clock / district / radio
  const mins = Math.floor(G.clockMin) % 60;
  const hrs = Math.floor(G.clockMin / 60) % 24;
  document.getElementById('clock').textContent =
    `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}  ·  Day ${G.day}`;
  document.getElementById('district').textContent = districtAt(G.player.x, G.player.z);
  document.getElementById('radio').textContent = '♪ ' + RADIOS[G.radio];
  // cash / rep
  document.getElementById('cash').textContent = '$' + G.cash.toLocaleString('en-US');
  document.getElementById('rep-fill').style.width = `${(G.xp % 800) / 8}%`;
  document.getElementById('rep-label').textContent = `REP Lv ${G.rep} — ${G.xp.toLocaleString('en-US')} XP`;
  // speed / car / condition / weapons
  const p = G.player;
  const kmh = p.car ? Math.round(Math.abs(p.speed) * 3.6) : 0;
  document.getElementById('speed').innerHTML = `${kmh} <small>KM/H</small>`;
  document.getElementById('car-name').textContent = p.car ? p.car.def.name : 'ON FOOT';
  const cond = p.car ? Math.round(p.car.condition) : 100;
  const fill = document.getElementById('car-cond-fill');
  fill.style.width = `${cond}%`;
  fill.style.background = cond > 50 ? '#7dff9a' : cond > 25 ? '#ffd23e' : '#ff4444';
  const w = WEAPONS[G.weapon];
  document.getElementById('weapons').innerHTML = WEAPONS.map((wp, i) => {
    const ammo = wp.ammo === Infinity ? '∞' : (i === G.weapon ? G.ammo : wp.ammo);
    return `<span class="${i === G.weapon ? 'sel' : ''}">${i + 1} ${wp.name} ${ammo}</span>`;
  }).join(' &nbsp;·&nbsp; ');
  drawMinimap(G);
}

export function drawMinimap(G) {
  const cv = document.getElementById('minimap');
  const ctx = cv.getContext('2d');
  const S = cv.width; // 400
  const W = 280;      // world span shown (-140..140)
  const toMap = (x, z) => [(x + 140) / W * S, (z + 140) / W * S];
  ctx.fillStyle = '#141021';
  ctx.fillRect(0, 0, S, S);
  // ocean + beach
  ctx.fillStyle = '#1d5578';
  ctx.fillRect(0, (60 + 140) / W * S, S, S - (60 + 140) / W * S);
  ctx.fillStyle = '#e8c98f';
  ctx.fillRect(0, (60 + 140) / W * S, S, 8);
  // roads
  ctx.strokeStyle = '#4a4552';
  ctx.lineWidth = 10;
  for (let i = 0; i <= 8; i++) {
    const c = -120 + i * 30;
    const [x] = toMap(c, 0);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, S); ctx.stroke();
    const [, z] = toMap(0, c);
    ctx.beginPath(); ctx.moveTo(0, z); ctx.lineTo(S, z); ctx.stroke();
  }
  ctx.strokeStyle = '#d8c25a';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 8; i++) {
    const c = -120 + i * 30;
    const [x] = toMap(c, 0);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, S); ctx.stroke();
    const [, z] = toMap(0, c);
    ctx.beginPath(); ctx.moveTo(0, z); ctx.lineTo(S, z); ctx.stroke();
  }
  // route line to mission target
  const [tx, tz] = G.missionTarget;
  const [mx, mz] = toMap(G.player.x, G.player.z);
  const [gx, gz] = toMap(tx, tz);
  ctx.strokeStyle = '#ffd23e';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath(); ctx.moveTo(mx, mz); ctx.lineTo(gx, gz); ctx.stroke();
  ctx.setLineDash([]);
  // mission blip (pulsing)
  const pulse = 8 + Math.sin(G.time * 4) * 3;
  ctx.fillStyle = '#ffd23e';
  ctx.beginPath(); ctx.arc(gx, gz, pulse, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a0f1e';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('!', gx, gz + 0.5);
  // police dots
  for (const car of G.police.cars) {
    const [cx, cz] = toMap(car.mesh.position.x, car.mesh.position.z);
    ctx.fillStyle = '#4da6ff';
    ctx.beginPath(); ctx.arc(cx, cz, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  if (G.police.heli) {
    const [hx, hz] = toMap(G.police.heli.position.x, G.police.heli.position.z);
    ctx.fillStyle = '#ff4444';
    ctx.beginPath(); ctx.arc(hx, hz, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  // player arrow
  ctx.save();
  ctx.translate(mx, mz);
  ctx.rotate(G.player.angle);
  ctx.fillStyle = '#7dff9a';
  ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 9); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#0a2010'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}
