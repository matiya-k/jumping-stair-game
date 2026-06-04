import { GAME } from '../data/constants.js';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create() {
    const cx = GAME.WIDTH / 2;

    // 반투명 오버레이
    this.add.rectangle(cx, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.6);

    this.add.text(cx, 220, '⏸ 일시정지', {
      fontSize: '32px', fill: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // 계속하기
    const resumeBtn = this.add.text(cx, 330, '▶  계속하기', {
      fontSize: '22px', fill: '#1a1a2e',
      backgroundColor: '#44ff88',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerdown', () => {
      this.scene.resume('GameScene');
      this.scene.stop();
    });

    // 타이틀로
    const titleBtn = this.add.text(cx, 410, '← 타이틀로', {
      fontSize: '18px', fill: '#aaaaaa',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    titleBtn.on('pointerover', () => titleBtn.setStyle({ fill: '#ffffff' }));
    titleBtn.on('pointerout', () => titleBtn.setStyle({ fill: '#aaaaaa' }));
    titleBtn.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene');
      const user = gameScene?.user ?? null;
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.stop();
      this.scene.start('TitleScene', { user });
    });

    // ESC로 resume
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.resume('GameScene');
      this.scene.stop();
    });
  }
}
