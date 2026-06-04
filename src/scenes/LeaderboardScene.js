import { GAME } from '../data/constants.js';
import { gameService } from '../lib/gameService.js';

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  init(data) {
    this.user = data?.user ?? null;
    this.fromScene = data?.from ?? 'TitleScene';
  }

  async create() {
    // 배경
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f3460, 0x0f3460, 1);
    bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

    const cx = GAME.WIDTH / 2;

    this.add.text(cx, 50, '🏆 리더보드', {
      fontSize: '28px', fill: '#ffd700',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    // 로딩 텍스트
    const loading = this.add.text(cx, 200, '불러오는 중...', {
      fontSize: '16px', fill: '#888888',
    }).setOrigin(0.5);

    try {
      const rows = await gameService.getLeaderboard(10);
      loading.destroy();
      this._renderRows(rows);
    } catch (e) {
      loading.setText('데이터를 불러올 수 없습니다.');
    }

    // 뒤로 가기
    const backBtn = this.add.text(cx, GAME.HEIGHT - 40, '← 뒤로', {
      fontSize: '18px', fill: '#aaaaaa',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setStyle({ fill: '#ffffff' }));
    backBtn.on('pointerout', () => backBtn.setStyle({ fill: '#aaaaaa' }));
    backBtn.on('pointerdown', () => {
      this.scene.start(this.fromScene, { user: this.user });
    });
  }

  _renderRows(rows) {
    const cx = GAME.WIDTH / 2;
    const startY = 100;
    const medals = ['🥇', '🥈', '🥉'];

    if (!rows || rows.length === 0) {
      this.add.text(cx, 200, '아직 기록이 없습니다.', {
        fontSize: '16px', fill: '#666666',
      }).setOrigin(0.5);
      return;
    }

    // 헤더
    this.add.text(30, startY, '순위', { fontSize: '13px', fill: '#888' });
    this.add.text(100, startY, '닉네임', { fontSize: '13px', fill: '#888' });
    this.add.text(320, startY, '점수', { fontSize: '13px', fill: '#888' });
    this.add.text(400, startY, 'LV', { fontSize: '13px', fill: '#888' });

    // 구분선
    const line = this.add.graphics();
    line.lineStyle(1, 0x333355);
    line.lineBetween(20, startY + 18, GAME.WIDTH - 20, startY + 18);

    rows.forEach((row, i) => {
      const y = startY + 30 + i * 38;
      const isTop3 = i < 3;
      const color = isTop3 ? ['#ffd700', '#cccccc', '#cd7f32'][i] : '#ffffff';
      const rank = medals[i] || `${i + 1}`;

      // 홀짝 행 배경
      if (i % 2 === 0) {
        const rowBg = this.add.graphics();
        rowBg.fillStyle(0xffffff, 0.03);
        rowBg.fillRect(16, y - 10, GAME.WIDTH - 32, 34);
      }

      this.add.text(32, y, rank, { fontSize: '16px', fill: color }).setOrigin(0, 0.5);
      this.add.text(100, y, this._truncate(row.username, 12), {
        fontSize: '15px', fill: color, fontStyle: isTop3 ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);
      this.add.text(320, y, row.score.toLocaleString(), {
        fontSize: '15px', fill: color,
      }).setOrigin(0, 0.5);
      this.add.text(410, y, `${row.level}`, {
        fontSize: '14px', fill: '#aaaaaa',
      }).setOrigin(0, 0.5);
    });
  }

  _truncate(str, max) {
    return str.length > max ? str.slice(0, max) + '…' : str;
  }
}
