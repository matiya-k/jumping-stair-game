/**
 * SoundManager
 * Web Audio API로 사운드를 프로그래매틱하게 생성.
 * 실제 오디오 파일이 생기면 Phaser의 this.sound.play()로 교체 가능.
 */
export class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.ctx = null;
    this.muted = false;
    this.bgmNodes = [];
    this.bgmInterval = null;
    this._init();
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API 미지원');
    }
  }

  // AudioContext는 사용자 제스처 이후 resume 필요
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this._stopBGM();
    else this.playBGM();
    return this.muted;
  }

  // ─── 효과음 ──────────────────────────────────────────────────

  playJump() {
    this._tone({ freq: 320, endFreq: 520, duration: 0.12, type: 'square', gain: 0.18 });
  }

  playLand() {
    this._noise({ duration: 0.06, gain: 0.12 });
  }

  playCoin() {
    // 동전 수집: 짧은 상승 두 음
    this._tone({ freq: 880, duration: 0.07, type: 'sine', gain: 0.2 });
    setTimeout(() => this._tone({ freq: 1320, duration: 0.1, type: 'sine', gain: 0.2 }), 70);
  }

  playPowerUp(type) {
    const configs = {
      jump:   { freq: 440, endFreq: 880, duration: 0.25, type: 'sawtooth', gain: 0.15 },
      speed:  { freq: 330, endFreq: 660, duration: 0.2,  type: 'square',   gain: 0.15 },
      shield: { freq: 528, endFreq: 792, duration: 0.3,  type: 'sine',     gain: 0.18 },
    };
    const cfg = configs[type] || configs.jump;
    this._tone(cfg);
  }

  playLevelUp() {
    // 레벨업: 4음 상승 팡파레
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this._tone({ freq, duration: 0.15, type: 'sine', gain: 0.2 }), i * 120);
    });
  }

  playGameOver() {
    // 게임오버: 하강하는 3음
    const notes = [440, 330, 220];
    notes.forEach((freq, i) => {
      setTimeout(() => this._tone({ freq, duration: 0.3, type: 'sawtooth', gain: 0.15 }), i * 250);
    });
  }

  playFragile() {
    // 부서지는 플랫폼: 짧은 크랙음
    this._noise({ duration: 0.12, gain: 0.18, decay: 0.08 });
  }

  // ─── BGM ─────────────────────────────────────────────────────

  playBGM() {
    if (this.muted || !this.ctx) return;
    this._stopBGM();

    // 간단한 아르페지오 BGM (레벨별 템포 변화)
    const level = this.scene.level || 1;
    const tempo = Math.max(180, 300 - level * 15); // 레벨 오를수록 빠르게

    const scale = [261, 294, 329, 349, 392, 440, 494, 523]; // C장조
    let step = 0;

    this.bgmInterval = setInterval(() => {
      if (this.muted) return;
      const freq = scale[step % scale.length];
      this._bgmTone(freq, tempo / 1000);
      step++;
    }, tempo);
  }

  _stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  updateBGMTempo() {
    if (!this.muted) this.playBGM(); // 레벨 변경 시 재시작
  }

  destroy() {
    this._stopBGM();
    if (this.ctx) this.ctx.close();
  }

  // ─── 내부 유틸 ───────────────────────────────────────────────

  _tone({ freq, endFreq, duration, type = 'sine', gain = 0.2 }) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.linearRampToValueAtTime(endFreq, now + duration);

    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  _bgmTone(freq, duration) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gainNode.gain.setValueAtTime(0.06, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.9);

    osc.start(now);
    osc.stop(now + duration);
  }

  _noise({ duration, gain = 0.15, decay }) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.ctx.createGain();
    source.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.start(now);
    source.stop(now + duration);
  }
}
