import { GAME } from '../data/constants.js';
import { gameService } from '../lib/gameService.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalLevel = data.level || 1;
    this.user = data.user ?? null;
  }

  async create() {
    const cx = GAME.WIDTH / 2;

    // 배경
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f3460, 0x0f3460, 1);
    bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    this.add.text(cx, 120, 'GAME OVER', {
      fontSize: '38px', fill: '#ff4444', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, 210, `점수`, { fontSize: '16px', fill: '#888' }).setOrigin(0.5);
    this.add.text(cx, 245, this.finalScore.toLocaleString(), {
      fontSize: '36px', fill: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 295, `레벨 ${this.finalLevel}`, {
      fontSize: '18px', fill: '#aaaaaa',
    }).setOrigin(0.5);

    // 내 순위 (로그인 시)
    if (this.user && this.finalScore > 0) {
      try {
        const rank = await gameService.getMyRank(this.finalScore);
        this.add.text(cx, 330, `🏅 현재 순위 ${rank}위`, {
          fontSize: '16px', fill: '#ffd700',
        }).setOrigin(0.5);
      } catch (_) {}
    }

    if (!this.user) {
      this.add.text(cx, 330, '로그인하면 점수가 저장돼요!', {
        fontSize: '13px', fill: '#666666',
      }).setOrigin(0.5);
    }

    // 다시 시작
    const restartBtn = this.add.text(cx, 410, '▶  다시 시작', {
      fontSize: '22px', fill: '#1a1a2e',
      backgroundColor: '#44ff88',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => restartBtn.setStyle({ backgroundColor: '#66ffaa' }));
    restartBtn.on('pointerout', () => restartBtn.setStyle({ backgroundColor: '#44ff88' }));
    restartBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { user: this.user });
    });

    // 리더보드
    const lbBtn = this.add.text(cx, 490, '🏆  리더보드', {
      fontSize: '18px', fill: '#ffd700',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    lbBtn.on('pointerover', () => lbBtn.setStyle({ fill: '#ffe84d' }));
    lbBtn.on('pointerout', () => lbBtn.setStyle({ fill: '#ffd700' }));
    lbBtn.on('pointerdown', () => {
      this.scene.start('LeaderboardScene', { user: this.user, from: 'GameOverScene' });
    });

    // 타이틀로
    const titleBtn = this.add.text(cx, 550, '← 타이틀', {
      fontSize: '15px', fill: '#666666',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    titleBtn.on('pointerover', () => titleBtn.setStyle({ fill: '#aaaaaa' }));
    titleBtn.on('pointerout', () => titleBtn.setStyle({ fill: '#666666' }));
    titleBtn.on('pointerdown', () => {
      this.scene.start('TitleScene', { user: this.user });
    });
  }
}
