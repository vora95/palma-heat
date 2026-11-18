// Palma Heat — procedural canvas textures. No external images, everything drawn.
const THREE = window.THREE;

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function windows(ctx, w, h, rng, palette, litRatio) {
  const cols = 4 + Math.floor(rng() * 3);
  const rows = 5 + Math.floor(rng() * 4);
  const cw = w / cols, ch = h / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const lit = rng() < litRatio;
      ctx.fillStyle = lit
        ? (rng() < 0.5 ? '#ffd98a' : '#ffb84d')
        : palette[Math.floor(rng() * palette.length)];
      ctx.fillRect(i * cw + cw * 0.22, j * ch + ch * 0.24, cw * 0.56, ch * 0.52);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(i * cw + cw * 0.22, j * ch + ch * 0.24, cw * 0.56, ch * 0.14);
    }
  }
}

// Three facade variants so buildings are not identical textured boxes.
export function facadeTextures(rng) {
  const variants = [];
  // Variant A — warm plaster, small balconies.
  variants.push(canvasTex(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e8a06a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < h; y += 64) ctx.fillRect(0, y, w, 3);
    windows(ctx, w, h, rng, ['#2c3e50', '#1e2a38', '#34495e'], 0.34);
    ctx.fillStyle = 'rgba(60,30,10,0.55)';
    for (let j = 0; j < 6; j++) ctx.fillRect(18, 40 + j * 80, w - 36, 5);
  }));
  // Variant B — cool glass tower, dense lit windows.
  variants.push(canvasTex(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#5d7a94'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let x = 0; x < w; x += 32) ctx.fillRect(x, 0, 4, h);
    windows(ctx, w, h, rng, ['#16222e', '#101c26', '#1d2f42'], 0.55);
    ctx.fillStyle = '#3d5a74'; ctx.fillRect(0, 0, w, 14);
  }));
  // Variant C — pastel stucco with arched ground floor.
  variants.push(canvasTex(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f2c9a0'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(180,90,40,0.16)';
    for (let y = 0; y < h; y += 42) ctx.fillRect(0, y, w, 2);
    windows(ctx, w, h, rng, ['#4a3226', '#33241c', '#5a4030'], 0.28);
    ctx.fillStyle = '#7a4a2a';
    ctx.fillRect(20, h - 78, 52, 78); ctx.fillRect(w - 72, h - 78, 52, 78);
    ctx.beginPath(); ctx.arc(46, h - 78, 26, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.arc(w - 46, h - 78, 26, Math.PI, 0); ctx.fill();
  }));
  return variants;
}

export function roadTexture() {
  return canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#33333d'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    ctx.fillStyle = '#d8c25a';
    ctx.fillRect(w / 2 - 2, 8, 4, 34); ctx.fillRect(w / 2 - 2, 86, 4, 34);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(4, 0, 3, h); ctx.fillRect(w - 7, 0, 3, h);
  });
}

export function sidewalkTexture() {
  return canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#8d8578'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * 32, 0); ctx.lineTo(i * 32, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 32); ctx.lineTo(w, i * 32); ctx.stroke();
    }
  });
}

export function pierTexture() {
  return canvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#8a5a33'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#a06c3e';
    for (let x = 0; x < w; x += 32) ctx.fillRect(x + 2, 0, 28, h);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (let x = 0; x < w; x += 32) ctx.fillRect(x, 0, 2, h);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let x = 0; x < w; x += 32) ctx.fillRect(x + 2, 0, 28, 3);
  });
}

export function sandTexture() {
  return canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#e8c98f'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(120,85,40,0.25)' : 'rgba(255,240,200,0.35)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
}

export function waterTexture() {
  return canvasTex(256, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#2a6f8f'); g.addColorStop(0.5, '#1d5578'); g.addColorStop(1, '#2a7a99');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const y = Math.random() * h, x = Math.random() * w, len = 20 + Math.random() * 50;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    }
  });
}

export function awningTexture(colorA, colorB) {
  return canvasTex(128, 64, (ctx, w, h) => {
    for (let x = 0; x < w; x += 16) {
      ctx.fillStyle = (x / 16) % 2 === 0 ? colorA : colorB;
      ctx.fillRect(x, 0, 16, h);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, h - 6, w, 6);
  });
}

// Procedural character portrait, drawn on a 112x112 canvas.
export function drawPortrait(canvas, ch) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = '#2a1a2e'; ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w / 2, h * 0.42, 8, w / 2, h * 0.5, 70);
  g.addColorStop(0, '#ff9a3d'); g.addColorStop(1, '#5a2333');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // shoulders / shirt
  ctx.fillStyle = ch.shirt;
  ctx.beginPath(); ctx.moveTo(8, h); ctx.quadraticCurveTo(w / 2, h * 0.62, w - 8, h); ctx.lineTo(w - 8, h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = ch.accent; ctx.fillRect(w / 2 - 4, h * 0.78, 8, h * 0.22);
  // neck + face
  ctx.fillStyle = ch.skin;
  ctx.fillRect(w / 2 - 9, h * 0.58, 18, 14);
  ctx.beginPath(); ctx.ellipse(w / 2, h * 0.42, 24, 28, 0, 0, Math.PI * 2); ctx.fill();
  // hair styles
  ctx.fillStyle = ch.hair;
  if (ch.hairStyle === 'bob') {
    ctx.beginPath(); ctx.ellipse(w / 2, h * 0.30, 27, 20, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(w / 2 - 27, h * 0.28, 8, 30); ctx.fillRect(w / 2 + 19, h * 0.28, 8, 30);
  } else if (ch.hairStyle === 'buzz') {
    ctx.beginPath(); ctx.ellipse(w / 2, h * 0.24, 25, 10, 0, Math.PI, 0); ctx.fill();
  } else if (ch.hairStyle === 'pony') {
    ctx.beginPath(); ctx.ellipse(w / 2, h * 0.26, 25, 14, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w / 2 + 30, h * 0.45, 7, 22, 0.4, 0, Math.PI * 2); ctx.fill();
  } else if (ch.hairStyle === 'slick') {
    ctx.beginPath(); ctx.ellipse(w / 2, h * 0.20, 24, 9, 0, Math.PI, 0); ctx.fill();
    ctx.fillRect(w / 2 - 24, h * 0.18, 48, 5);
  } else if (ch.hairStyle === 'mohawk') {
    ctx.fillRect(w / 2 - 5, h * 0.02, 10, 30);
    ctx.beginPath(); ctx.moveTo(w / 2 - 8, h * 0.10); ctx.lineTo(w / 2, h * 0.0); ctx.lineTo(w / 2 + 8, h * 0.10); ctx.closePath(); ctx.fill();
  } else { // spiky
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(w / 2 + i * 10 - 5, h * 0.26); ctx.lineTo(w / 2 + i * 10, h * 0.08); ctx.lineTo(w / 2 + i * 10 + 5, h * 0.26); ctx.closePath(); ctx.fill();
    }
  }
  // eyes, brows, nose, mouth
  ctx.fillStyle = '#1a1210';
  ctx.beginPath(); ctx.ellipse(w / 2 - 10, h * 0.42, 3.4, 4.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w / 2 + 10, h * 0.42, 3.4, 4.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(w / 2 - 9, h * 0.40, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w / 2 + 11, h * 0.40, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ch.hair; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(w / 2 - 14, h * 0.35); ctx.lineTo(w / 2 - 6, h * 0.345); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w / 2 + 6, h * 0.345); ctx.lineTo(w / 2 + 14, h * 0.35); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w / 2, h * 0.45); ctx.lineTo(w / 2 - 2, h * 0.52); ctx.stroke();
  ctx.strokeStyle = '#7a2a20'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w / 2 - 7, h * 0.58); ctx.quadraticCurveTo(w / 2, h * 0.63, w / 2 + 7, h * 0.58); ctx.stroke();
  return canvas;
}
