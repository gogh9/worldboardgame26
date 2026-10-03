// Headless run of the real app.js: roll dice -> arrive -> check that the modal opens.
import fs from 'fs';
const html = fs.readFileSync('index.html', 'utf8');
const ids = [...html.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);

function mkEl(id) {
  const el = {
    id, value: '', textContent: '', innerHTML: '', disabled: false, src: '', placeholder: '',
    offsetWidth: 0, scrollTop: 0, scrollHeight: 0, dataset: {}, children: [],
    style: { setProperty() {} },
    classList: {
      s: new Set(),
      add(...c) { c.forEach(x => this.s.add(x)); }, remove(...c) { c.forEach(x => this.s.delete(x)); },
      contains(c) { return this.s.has(c); },
      toggle(c, f) { (f === undefined ? !this.s.has(c) : f) ? this.s.add(c) : this.s.delete(c); }
    },
    appendChild(ch) { this.children.push(ch); if (ch.id) els[ch.id] = ch; return ch; },
    addEventListener() {}, removeEventListener() {}, remove() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    focus() {}, getBoundingClientRect() { return { left: 0, top: 0, width: 10, height: 10 }; }
  };
  return el;
}
const els = {};
ids.forEach(id => els[id] = mkEl(id));
let domReady = null;
global.document = {
  getElementById: id => els[id] || null,
  querySelector: () => null, querySelectorAll: () => [],
  createElement: () => mkEl(''), body: mkEl('body')
};
global.window = {
  location: { origin: 'x', pathname: '/', search: '' },
  addEventListener: (ev, fn) => { if (ev === 'DOMContentLoaded') domReady = fn; },
  AudioContext: undefined, webkitAudioContext: undefined
};
global.localStorage = { getItem: () => '테스터', setItem() {} };
// navigator is read-only in Node 22; not needed for this flow
global.alert = m => console.log('ALERT', m);

(async () => {
  await import('../js/app.js');
  domReady();
  const app = window.worldGame;
  app.network = null;          // offline single-device
  app.mode = 'LOCAL';
  app.state.status = 'PLAYING';
  app.state.players = [
    { id: 0, name: 'A', charId: 0, position: 0, conqueredCount: 0, isIslandSkip: false },
    { id: 1, name: 'B', charId: 1, position: 0, conqueredCount: 0, isIslandSkip: false }
  ];
  app.renderBoard(); app.updateGameUI();

  for (const [idx, label] of [[1, 'quiz'], [5, 'climate'], [2, 'terrain']]) {
    els['modal-quiz'].classList.s.clear(); els['modal-card'].classList.s.clear();
    try {
      app.handleCellArrival(0, idx);
      const target = label === 'quiz' ? 'modal-quiz' : 'modal-card';
      console.log(`${label} cell ${idx}: modal open =`, els[target].classList.contains('active'));
    } catch (e) { console.log(`${label} cell ${idx}: CRASH ->`, e.message); }
  }
  // Full path via dice roll
  els['modal-quiz'].classList.s.clear(); els['modal-card'].classList.s.clear();
  app.state.players[0].position = 0;
  const origRandom = Math.random; Math.random = () => 0; // dice = 1 -> cell 1 (quiz)
  try { app.handleRollDice(); } catch (e) { console.log('roll CRASH ->', e.message); }
  Math.random = origRandom;
  setTimeout(() => {
    console.log('after dice roll to cell 1: quiz modal open =', els['modal-quiz'].classList.contains('active'));
    process.exit(0);
  }, 2500);
})().catch(e => { console.log('FATAL', e); process.exit(1); });
