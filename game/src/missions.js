// Palma Heat — missions and dialogue. Six chained contracts, each with a
// speaker, three dialogue lines and a cash reward.
import { MISSIONS, CHARACTERS } from './config.js';
import { drawPortrait } from './textures.js';

export function createMissions() {
  return {
    index: 0,
    line: 0,
    active: false,       // dialogue open
    done: false,         // all six finished
    toastTimer: 0,
  };
}

export function currentMission(m) {
  return MISSIONS[Math.min(m.index, MISSIONS.length - 1)];
}

export function missionTarget(m) {
  return currentMission(m).target;
}

export function characterById(id) {
  return CHARACTERS.find((c) => c.id === id);
}

function showDialogue(m) {
  const mission = currentMission(m);
  const ch = characterById(mission.who);
  const box = document.getElementById('dialogue');
  const text = document.getElementById('dlg-text');
  document.getElementById('dlg-name').textContent = ch.name;
  document.getElementById('dlg-role').textContent = ch.role;
  drawPortrait(document.getElementById('portrait'), ch);
  text.textContent = mission.lines[m.line];
  box.style.display = 'block';
}

export function hideDialogue() {
  document.getElementById('dialogue').style.display = 'none';
}

export function openMissionDialogue(m, line = 0) {
  m.line = line;
  m.active = true;
  showDialogue(m);
}

export function advanceDialogue(m, onComplete) {
  const mission = currentMission(m);
  m.line += 1;
  if (m.line >= mission.lines.length) {
    m.active = false;
    hideDialogue();
    onComplete(mission);
  } else {
    showDialogue(m);
  }
}

export function completeMission(m, G) {
  const mission = currentMission(m);
  G.cash += mission.reward;
  G.xp += 220;
  G.rep = Math.min(5, 1 + Math.floor(G.xp / 800));
  showToast(`MISI SELESAI — ${mission.title}`, `+$${mission.reward}  ·  +220 XP`);
  m.index += 1;
  m.line = 0;
  if (m.index >= MISSIONS.length) {
    m.done = true;
    showToast('PALMA MILIKMU', 'Semua enam kontrak selesai. Legenda jalanan.');
  } else {
    const next = currentMission(m);
    document.getElementById('objective-text').textContent = next.objective;
  }
}

export function showToast(title, sub) {
  const t = document.getElementById('toast');
  t.innerHTML = '';
  const b = document.createElement('div');
  b.textContent = title;
  t.appendChild(b);
  if (sub) {
    const s = document.createElement('small');
    s.textContent = sub;
    t.appendChild(s);
  }
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 3600);
}
