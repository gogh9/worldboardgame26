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

(async () => {
  await import('../js/app.js');
  domReady();
  const app = window.worldGame;
  app.network = null;
  app.mode = 'LOCAL';
  app.state.status = 'PLAYING';
  app.state.turnIndex = 0; // 플레이어 0(A)의 차례
  app.state.players = [
    { id: 0, name: '탐험가A', charId: 0, position: 0, conqueredCount: 0, isIslandSkip: false, isWorldTravel: false, hasWorldTravelTicket: false },
    { id: 1, name: '탐험가B', charId: 1, position: 0, conqueredCount: 0, isIslandSkip: false, isWorldTravel: false, hasWorldTravelTicket: false }
  ];
  app.renderBoard(); app.updateGameUI();

  console.log('=== TEST 1: 내가 점령한 땅 도착 시 모달 확인 및 턴 전환 검증 ===');
  // 1번 칸을 플레이어 0(A)이 점령했다고 설정
  app.state.cells[1].ownerId = 0;
  let confirmCallback = null;
  app.openSpecialModal = (title, desc, onConfirm) => {
    console.log(`[SpecialModal 열림] 제목="${title}", 내용="${desc}"`);
    confirmCallback = onConfirm;
  };

  // 플레이어 0이 1번 칸(내가 점령한 땅)에 도착
  app.handleCellArrival(0, 1);
  if (confirmCallback) {
    console.log('모달 확인 버튼 클릭 시뮬레이션...');
    confirmCallback();
    console.log(`확인 후 현재 turnIndex = ${app.state.turnIndex} (플레이어 B: ${app.state.players[app.state.turnIndex].name})`);
    if (app.state.turnIndex === 1) {
      console.log('>> PASS: 내가 점령한 땅 도착 후 확인 시 다음 플레이어(B)에게 정상 전환됨!\n');
    } else {
      console.error('>> FAIL: 턴이 다음 플레이어에게 전환되지 않음!\n');
      process.exit(1);
    }
  } else {
    console.error('>> FAIL: 특수 모달이 열리지 않음!\n');
    process.exit(1);
  }

  console.log('=== TEST 2: 다른 사람이 점령한 땅 도착 시 모달 확인 및 턴 전환 검증 ===');
  // 현재는 플레이어 1(B)의 차례
  confirmCallback = null;
  // 플레이어 1이 1번 칸(A가 점령한 땅)에 도착
  app.handleCellArrival(1, 1);
  if (confirmCallback) {
    console.log('모달 확인 버튼 클릭 시뮬레이션...');
    confirmCallback();
    console.log(`확인 후 현재 turnIndex = ${app.state.turnIndex} (플레이어 A: ${app.state.players[app.state.turnIndex].name})`);
    if (app.state.turnIndex === 0) {
      console.log('>> PASS: 다른 사람이 점령한 땅 도착 후 확인 시 다음 플레이어(A)에게 정상 전환됨!\n');
    } else {
      console.error('>> FAIL: 턴이 다음 플레이어에게 전환되지 않음!\n');
      process.exit(1);
    }
  } else {
    console.error('>> FAIL: 특수 모달이 열리지 않음!\n');
    process.exit(1);
  }

  console.log('=== TEST 3: 세계여행 칸 도착 시 턴 넘김 및 다음 차례 발동 검증 ===');
  // 현재 플레이어 0(A)의 차례
  confirmCallback = null;
  // 플레이어 0이 7번 칸(세계여행 칸)에 도착
  app.handleCellArrival(0, 7);
  console.log(`도착 직후 A의 상태: hasWorldTravelTicket=${app.state.players[0].hasWorldTravelTicket}, isWorldTravel=${app.state.players[0].isWorldTravel}`);
  if (app.state.players[0].isWorldTravel === false && app.state.players[0].hasWorldTravelTicket === true) {
    console.log('>> PASS: 도착한 턴에는 isWorldTravel이 false로 유지되어 즉시 목적지 선택창이 열리지 않음!');
  } else {
    console.error('>> FAIL: 도착한 턴에 isWorldTravel이 true로 잘못 설정됨!\n');
    process.exit(1);
  }

  // 모달 확인 누름
  if (confirmCallback) {
    confirmCallback();
    console.log(`세계여행 획득 후 턴 넘김: 현재 turnIndex = ${app.state.turnIndex} (플레이어 B: ${app.state.players[app.state.turnIndex].name})`);
    if (app.state.turnIndex === 1) {
      console.log('>> PASS: 세계여행 칸 도착 후 확인 시 즉시 다른 사람(B)에게 턴이 넘어감!\n');
    } else {
      console.error('>> FAIL: 세계여행 후 턴이 다른 사람에게 안 넘어감!\n');
      process.exit(1);
    }
  }

  // 플레이어 B가 차례를 마치고 advanceTurn()을 호출하여 다시 플레이어 A의 차례가 됨
  console.log('플레이어 B가 차례를 마치고 advanceTurn()...');
  app.advanceTurn();
  console.log(`한 바퀴 돌아 다시 A 차례가 됨: turnIndex = ${app.state.turnIndex} (플레이어 A: ${app.state.players[app.state.turnIndex].name})`);
  console.log(`A의 상태: hasWorldTravelTicket=${app.state.players[0].hasWorldTravelTicket}, isWorldTravel=${app.state.players[0].isWorldTravel}`);
  if (app.state.players[0].isWorldTravel === true && app.state.players[0].hasWorldTravelTicket === false) {
    console.log('>> PASS: 다른 사람의 턴이 끝나고 다시 내 차례가 되었을 때 비로소 isWorldTravel이 true로 발동!\n');
  } else {
    console.error('>> FAIL: 내 차례가 되었을 때 세계여행이 발동하지 않음!\n');
    process.exit(1);
  }

  console.log('모든 핵심 게임 흐름 시나리오 테스트 완벽 통과 (100% PASS)!');
  process.exit(0);
})();
