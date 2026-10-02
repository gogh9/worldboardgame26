// SoundManager: 효과음 비활성화 (음소거 모드)

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {}
  toggleSound() { return false; }
  playDiceRoll() {}
  playStep() {}
  playCardFlip() {}
  playCorrect() {}
  playWrong() {}
  playVictory() {}
  playItemGet() {}
}

export const sound = new SoundManager();
