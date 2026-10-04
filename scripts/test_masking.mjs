import { BOARD_CELLS } from '../js/boardData.js';

console.log('=== 1. BOARD_CELLS travelTitle 마스킹 검증 ===');
let allMasked = true;
BOARD_CELLS.forEach(cell => {
  if (cell.type === 'quiz') {
    const hasCircles = cell.travelTitle && cell.travelTitle.includes('○');
    console.log(`[${cell.index}번 ${cell.badge}]: 원본="${cell.title}" ➔ 마스킹="${cell.travelTitle}" (○ 포함: ${hasCircles})`);
    if (!hasCircles) allMasked = false;
  }
});

if (allMasked) {
  console.log('>> 모든 퀴즈 칸의 travelTitle이 ○○ 표기로 완벽히 마스킹되어 있습니다! PASS\n');
} else {
  console.error('>> FAIL: 마스킹되지 않은 퀴즈 칸이 있습니다!\n');
  process.exit(1);
}
