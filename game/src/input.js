// Palma Heat — keyboard input state.
export function createInput() {
  const keys = {};
  const pressed = {};
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys[e.code] = true;
    pressed[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  return {
    keys,
    wasPressed(code) {
      const v = !!pressed[code];
      pressed[code] = false;
      return v;
    },
    flush() { for (const k in pressed) pressed[k] = false; },
    get up() { return keys['KeyW'] || keys['ArrowUp']; },
    get down() { return keys['KeyS'] || keys['ArrowDown']; },
    get left() { return keys['KeyA'] || keys['ArrowLeft']; },
    get right() { return keys['KeyD'] || keys['ArrowRight']; },
    get run() { return keys['ShiftLeft'] || keys['ShiftRight']; },
  };
}
