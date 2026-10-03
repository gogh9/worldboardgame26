// Simulate exact browser environment
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Parse HTML to get all IDs
const idMatches = [...html.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
console.log('Total IDs in HTML:', idMatches.length);

const elements = {};
idMatches.forEach(id => {
  elements[id] = {
    id,
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); },
      toggle(c, f) { if (f !== undefined) { f ? this.add(c) : this.remove(c); } else { this.contains(c) ? this.remove(c) : this.add(c); } }
    },
    style: {},
    dataset: {},
    value: '',
    textContent: '',
    innerHTML: '',
    disabled: false,
    appendChild: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    focus: () => {}
  };
});

global.document = {
  getElementById: (id) => elements[id] || null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (tag) => ({
    tagName: tag,
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); },
      toggle(c) { this.contains(c) ? this.remove(c) : this.add(c); }
    },
    style: { setProperty: () => {} },
    appendChild: () => {}
  }),
  body: { style: {} }
};

global.window = {
  location: { origin: 'http://localhost', pathname: '/', search: '' },
  addEventListener: () => {},
  localStorage: { getItem: () => '테스터', setItem: () => {} }
};
global.localStorage = global.window.localStorage;

async function run() {
  const { BOARD_CELLS, CLIMATE_CARDS, TERRAIN_CARDS } = await import('../js/boardData.js');
  console.log('BOARD_CELLS loaded:', BOARD_CELLS.length);

  // Check if modal-quiz exists
  const modalQuiz = global.document.getElementById('modal-quiz');
  console.log('modalQuiz element found:', !!modalQuiz);

  const modalBackdrop = elements['modal-quiz'];
  console.log('modalBackdrop classes:', [...modalBackdrop.classList.classes]);
}

run();
