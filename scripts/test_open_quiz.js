const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const idMatches = [...html.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);

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
global.sound = {
  playItemGet: () => {},
  playStep: () => {},
  playDiceRoll: () => {},
  playCorrect: () => {},
  playWrong: () => {},
  playCardFlip: () => {},
  playVictory: () => {}
};

async function testApp() {
  // Read app.js and inspect openQuizModal and handleCellArrival
  const appJs = fs.readFileSync('js/app.js', 'utf8');
  console.log('Testing openQuizModal logic directly:');

  const { BOARD_CELLS } = await import('../js/boardData.js');
  const cell = BOARD_CELLS[1];
  console.log('Cell 1 title:', cell.title);

  // Check all getElementById in openQuizModal:
  const badgeElem = global.document.getElementById('quiz-cell-badge');
  const regionElem = global.document.getElementById('quiz-cell-region');
  const titleElem = global.document.getElementById('quiz-cell-title');
  const qTextElem = global.document.getElementById('quiz-question-text');
  const inputForm = global.document.getElementById('quiz-input-form');
  const inputAnswer = global.document.getElementById('quiz-input-answer');
  const btnSubmit = global.document.getElementById('btn-quiz-submit');
  const feedbackBox = global.document.getElementById('quiz-feedback-box');
  const modalQuiz = global.document.getElementById('modal-quiz');

  console.log('All elements found:');
  console.log('quiz-cell-badge:', !!badgeElem);
  console.log('quiz-cell-region:', !!regionElem);
  console.log('quiz-cell-title:', !!titleElem);
  console.log('quiz-question-text:', !!qTextElem);
  console.log('quiz-input-form:', !!inputForm);
  console.log('quiz-input-answer:', !!inputAnswer);
  console.log('btn-quiz-submit:', !!btnSubmit);
  console.log('quiz-feedback-box:', !!feedbackBox);
  console.log('modal-quiz:', !!modalQuiz);
}

testApp();
