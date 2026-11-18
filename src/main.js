import { GameManager } from './core/GameManager.js';

try {
  new GameManager();
} catch (e) {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#c99;font-family:monospace;background:#000;padding:20px;text-align:center">Failed to start: ${String(e.message || e)}<br>WebGL may be unavailable in this browser.</div>`);
}
