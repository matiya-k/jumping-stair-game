import { GAME } from '../data/constants.js';
import { authService } from '../lib/authService.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  init(data) {
    this.user = data?.user ?? null;
  }

  async create() {
    // 배경
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f3460, 0x0f3460, 1);
    bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    // 별
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME.WIDTH);
      const y = Phaser.Math.Between(0, GAME.HEIGHT);
      this.add.circle(x, y, Math.random() < 0.3 ? 2 : 1, 0xffffff,
        Phaser.Math.FloatBetween(0.3, 0.9));
    }

    const cx = GAME.WIDTH / 2;

    // 타이틀
    const title = this.add.text(cx, 120, '🪜 계단 오르기', {
      fontSize: '34px', fill: '#ffffff', fontStyle: 'bold',
      stroke: '#4a90d9', strokeThickness: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: 110,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 유저 정보 표시
    if (this.user) {
      const username = await authService.getUsername(this.user.id) || '플레이어';

      this.add.text(cx, 195, `👤 ${username}`, {
        fontSize: '16px', fill: '#aaddff',
      }).setOrigin(0.5);

      // 로그아웃 버튼
      const logoutBtn = this.add.text(cx, 220, '로그아웃', {
        fontSize: '13px', fill: '#888888',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      logoutBtn.on('pointerover', () => logoutBtn.setStyle({ fill: '#ff6b6b' }));
      logoutBtn.on('pointerout', () => logoutBtn.setStyle({ fill: '#888888' }));
      logoutBtn.on('pointerdown', async () => {
        await authService.signOut();
        this.scene.start('AuthScene');
      });
    } else {
      this.add.text(cx, 200, '게스트 모드', {
        fontSize: '14px', fill: '#666666',
      }).setOrigin(0.5);
    }

    // 플레이 버튼
    const playBtn = this.add.text(cx, 310, '▶  게임 시작', {
      fontSize: '24px', fill: '#1a1a2e',
      backgroundColor: '#4a90d9',
      padding: { x: 28, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setStyle({ backgroundColor: '#5ba3e8' }));
    playBtn.on('pointerout', () => playBtn.setStyle({ backgroundColor: '#4a90d9' }));
    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { user: this.user });
    });

    // 리더보드 버튼
    const lbBtn = this.add.text(cx, 390, '🏆  리더보드', {
      fontSize: '18px', fill: '#ffd700',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    lbBtn.on('pointerover', () => lbBtn.setStyle({ fill: '#ffe84d' }));
    lbBtn.on('pointerout', () => lbBtn.setStyle({ fill: '#ffd700' }));
    lbBtn.on('pointerdown', () => {
      this.scene.start('LeaderboardScene', { user: this.user });
    });

    // 조작법
    this.add.text(cx, 500, '← → 이동   ↑ / Space 점프', {
      fontSize: '13px', fill: '#666666',
    }).setOrigin(0.5);
    this.add.text(cx, 520, '🟠 이동 플랫폼   🔴 부서지는 플랫폼', {
      fontSize: '12px', fill: '#555555',
    }).setOrigin(0.5);
  }
}
