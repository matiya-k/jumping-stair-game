import { GAME } from '../data/constants.js';

const POWERUP_ICONS = {
  jump:   { label: '↑ 점프', color: '#ffdd00' },
  speed:  { label: '▶ 스피드', color: '#ff6600' },
  shield: { label: '◆ 무적', color: '#44aaff' },
};

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // 점수
    this.scoreText = this.add.text(12, 12, '점수: 0', {
      fontSize: '18px', fill: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    });

    // 레벨
    this.levelText = this.add.text(GAME.WIDTH / 2, 12, 'LV.1', {
      fontSize: '18px', fill: '#ffd700',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0);

    // 뮤트 버튼
    this.muteBtn = this.add.text(GAME.WIDTH - 44, 10, '🔊', {
      fontSize: '20px',
    }).setInteractive({ useHandCursor: true });

    this.muteBtn.on('pointerdown', () => {
      const gs = this.scene.get('GameScene');
      if (gs?.sound_) {
        const muted = gs.sound_.toggleMute();
        this.muteBtn.setText(muted ? '🔇' : '🔊');
      }
    });

    // 일시정지 버튼
    this.pauseBtn = this.add.text(GAME.WIDTH - 12, 10, '⏸', {
      fontSize: '20px',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    this.pauseBtn.on('pointerdown', () => {
      const gs = this.scene.get('GameScene');
      if (gs && !gs.gameOver) {
        gs.scene.pause();
        this.scene.launch('PauseScene');
      }
    });

    // 파워업 아이콘
    this.powerUpIcons = {};

    // GameScene 이벤트
    const gameScene = this.scene.get('GameScene');

    gameScene.events.on('scoreUpdate', (score, level) => {
      this.scoreText.setText(`점수: ${score.toLocaleString()}`);
    });

    gameScene.events.on('levelUp', (level) => {
      this.levelText.setText(`LV.${level}`);
      this._flashLevelText();
    });

    gameScene.events.on('powerUp', (type) => {
      this._showPowerUpIcon(type);
    });
  }

  _showPowerUpIcon(type) {
    const def = POWERUP_ICONS[type];
    if (!def) return;

    if (this.powerUpIcons[type]) {
      this.tweens.killTweensOf(this.powerUpIcons[type]);
      this.powerUpIcons[type].destroy();
    }

    const slots = Object.keys(POWERUP_ICONS);
    const idx = slots.indexOf(type);
    const x = 12 + idx * 100;
    const y = GAME.HEIGHT - 140;

    const icon = this.add.text(x, y, def.label, {
      fontSize: '14px', fill: def.color,
      backgroundColor: '#000000bb',
      padding: { x: 8, y: 4 },
      stroke: '#000000', strokeThickness: 2,
    });

    this.powerUpIcons[type] = icon;

    this.tweens.add({
      targets: icon, alpha: 0, duration: 200, yoyo: true, repeat: 3,
      onComplete: () => {
        this.time.delayedCall(2500, () => {
          if (icon?.active) {
            this.tweens.add({
              targets: icon, alpha: 0, duration: 600,
              onComplete: () => { icon.destroy(); delete this.powerUpIcons[type]; },
            });
          }
        });
      },
    });
  }

  _flashLevelText() {
    this.tweens.add({
      targets: this.levelText,
      scaleX: 1.6, scaleY: 1.6, duration: 180, yoyo: true,
      onComplete: () => this.levelText.setScale(1),
    });
  }
}
