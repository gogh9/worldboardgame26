const fs = require('fs');

// Create a minimal DOM mock
const domStore = {};
const globalMock = {
  document: {
    getElementById: (id) => {
      if (!domStore[id]) {
        domStore[id] = {
          id,
          classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); },
            toggle(c, force) { if (force !== undefined) { force ? this.add(c) : this.remove(c); } else { this.contains(c) ? this.remove(c) : this.add(c); } }
          },
          style: {},
          dataset: {},
          appendChild: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          querySelector: () => null,
          querySelectorAll: () => [],
          focus: () => {}
        };
      }
      return domStore[id];
    },
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
  },
  window: {
    location: { origin: 'http://localhost', pathname: '/', search: '' },
    addEventListener: () => {},
    localStorage: { getItem: () => '테스터', setItem: () => {} }
  },
  localStorage: { getItem: () => '테스터', setItem: () => {} }
};

global.document = globalMock.document;
global.window = globalMock.window;
global.localStorage = globalMock.localStorage;

// Load module
async function test() {
  const { BOARD_CELLS, CLIMATE_CARDS, TERRAIN_CARDS } = await import('../js/boardData.js');
  console.log('Board cells count:', BOARD_CELLS.length);
  console.log('Cell 1:', BOARD_CELLS[1]);
  console.log('Cell 2 (terrain):', BOARD_CELLS[2]);
  console.log('Cell 5 (climate):', BOARD_CELLS[5]);
}

test();
