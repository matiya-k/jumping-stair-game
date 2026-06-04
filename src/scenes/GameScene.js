import { Player } from '../objects/Player.js';
import { PlatformManager } from '../objects/PlatformManager.js';
import { ItemManager } from '../objects/ItemManager.js';
import { SoundManager } from '../systems/SoundManager.js';
import { TouchControls } from '../systems/TouchControls.js';
import { authService } from '../lib/authService.js';
import { gameService } from '../lib/gameService.js';
import { GAME, ITEMS } from '../data/constants.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.user = data?.user ?? null;
  }

  // ─── 텍스처 생성 ────────────────────────────────────────────
  _createTextures() {
    if (!this.textures.exists('player')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x5dade2);
      g.fillRoundedRect(2, 8, 28, 22, 5);
      g.fillStyle(0xf0e6d3);
      g.fillCircle(16, 8, 10);
      g.fillStyle(0x222222);
      g.fillCircle(12, 6, 2);
      g.fillCircle(20, 6, 2);
      g.generateTexture('player', 32, 32);
      g.destroy();
    }

    ['normal', 'moving', 'fragile'].forEach(type => {
      const key = `platform_${type}`;
      if (this.textures.exists(key)) return;
      const colors = {
        normal:  [0x4a90d9, 0x6aaee8],
        moving:  [0xf5a623, 0xf7c06e],
        fragile: [0xe74c3c, 0xec7063],
      };
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(colors[type][0]);
      g.fillRoundedRect(0, 0, 100, 16, 4);
      g.fillStyle(colors[type][1]);
      g.fillRect(4, 2, 92, 4);
      if (type === 'fragile') {
        g.lineStyle(1, 0xc0392b);
        g.lineBetween(20, 4, 30, 12);
        g.lineBetween(60, 2, 75, 14);
      }
      g.generateTexture(key, 100, 16);
      g.destroy();
    });
  }

  // ─── create ─────────────────────────────────────────────────
  create() {
    this._createTextures();
    this._createBackground();

    // 사운드
    this.sound_ = new SoundManager(this);
    this.input.once('pointerdown', () => this.sound_.resume());
    this.input.keyboard.once('keydown', () => {
      this.sound_.resume();
      this.sound_.playBGM();
    });

    // 플랫폼
    this.platformManager = new PlatformManager(this);

    // 아이템
    this.itemManager = new ItemManager(this);
    this.platformManager.onSpawn = (x, y) => this.itemManager.trySpawnOn(x, y);

    this.platformManager.init();

    // 플레이어
    this.player = new Player(this, GAME.WIDTH / 2, GAME.HEIGHT - 80);

    // 터치 조작
    this.touchControls = new TouchControls(this);
    this.player.touch = this.touchControls;

    // 충돌
    this.physics.add.collider(
      this.player.sprite,
      this.platformManager.getGroup(),
      this._onLand,
      this._canLand,
      this
    );

    // 아이템 수집
    this.itemManager.setupOverlap(this.player.sprite, (type) => {
      this._onCollectItem(type);
    });

    // 카메라
    this.cameras.main.setBounds(0, -999999, GAME.WIDTH, 999999 + GAME.HEIGHT);
    this.cameras.main.startFollow(this.player.sprite, true, 0, 0.08);
    this.cameras.main.setDeadzone(GAME.WIDTH, 80);

    // 점수 / 레벨
    this.score = 0;
    this.level = 1;
    this.highestPlayerY = this.player.y;
    this._wasOnGround = false;

    // 일시정지 키 (ESC / P)
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P).on('down', () => this._pause());
    this.pauseKey.on('down', () => this._pause());

    // HUD
    this.scene.launch('UIScene', { gameScene: this });

    this.gameOver = false;
  }

  // ─── 일시정지 ────────────────────────────────────────────────
  _pause() {
    if (this.gameOver) return;
    this.scene.pause();
    this.scene.launch('PauseScene');
  }

  // ─── 착지 ───────────────────────────────────────────────────
  _canLand(playerSprite, platformSprite) {
    return playerSprite.body.velocity.y >= 0 &&
           playerSprite.body.bottom <= platformSprite.body.top + 10;
  }

  _onLand(playerSprite, platformSprite) {
    this.platformManager.onLand(platformSprite);
    const p = this.platformManager.platforms.find(p => p.sprite === platformSprite);
    if (p?.type === 'fragile') {
      this.sound_.playFragile();
      this.cameras.main.shake(80, 0.006);
    } else {
      this.sound_.playLand();
    }
  }

  // ─── 아이템 수집 ─────────────────────────────────────────────
  _onCollectItem(type) {
    if (type === 'coin') {
      const bonus = 20 + this.level * 5;
      this.score += bonus;
      this._showFloatingText(`+${bonus}`, this.player.x, this.player.y - 20, '#ffd700');
      this.events.emit('scoreUpdate', this.score, this.level);
      this.sound_.playCoin();
    } else {
      this.player.applyPowerUp(type);
      const labels = { jump: '점프 강화!', speed: '스피드 업!', shield: '무적!' };
      this._showFloatingText(labels[type] || '파워업!', this.player.x, this.player.y - 20, '#ffffff');
      this.events.emit('powerUp', type);
      this.sound_.playPowerUp(type);
      this.cameras.main.flash(200, 80, 160, 255, false);
    }
  }

  // ─── 플로팅 텍스트 ───────────────────────────────────────────
  _showFloatingText(text, x, y, color = '#ffffff') {
    const t = this.add.text(x, y, text, {
      fontSize: '16px', fill: color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: t, y: y - 50, alpha: 0, duration: 900,
      onComplete: () => t.destroy(),
    });
  }

  // ─── 배경 ───────────────────────────────────────────────────
  _createBackground() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x0f3460, 1);
    bg.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    bg.setScrollFactor(0);

    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GAME.WIDTH);
      const y = Phaser.Math.Between(0, GAME.HEIGHT);
      this.add.circle(x, y - 100000, Math.random() < 0.3 ? 2 : 1,
        0xffffff, Phaser.Math.FloatBetween(0.3, 0.9)).setScrollFactor(0.05);
    }
  }

  // ─── update ─────────────────────────────────────────────────
  update() {
    if (this.gameOver) return;

    const onGround = this.player.sprite.body.blocked.down;

    // 점프 사운드
    if (this._wasOnGround && !onGround && this.player.sprite.body.velocity.y < 0) {
      this.sound_.playJump();
    }
    this._wasOnGround = onGround;

    this.player.update();

    const camY = this.cameras.main.scrollY;
    this.platformManager.update(camY);
    this.itemManager.cleanup(camY);

    // 점수
    if (this.player.y < this.highestPlayerY) {
      const delta = this.highestPlayerY - this.player.y;
      this.highestPlayerY = this.player.y;
      this.score += Math.floor(delta / 10);
      this._checkLevelUp();
      this.events.emit('scoreUpdate', this.score, this.level);
    }

    // 낙사 감지
    if (this.player.y > camY + GAME.HEIGHT + 50) {
      this._triggerGameOver();
    }
  }

  // ─── 레벨업 ─────────────────────────────────────────────────
  _checkLevelUp() {
    const newLevel = Math.floor(this.score / 100) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.events.emit('levelUp', this.level);
      this.sound_.playLevelUp();
      this.sound_.updateBGMTempo();
      this._showLevelUpText();
      this.cameras.main.flash(300, 255, 220, 0, false);
    }
  }

  _showLevelUpText() {
    const t = this.add.text(
      GAME.WIDTH / 2,
      this.cameras.main.scrollY + 200,
      `✦ LEVEL ${this.level} ✦`,
      { fontSize: '30px', fill: '#ffd700', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: t, y: t.y - 80, alpha: 0, duration: 1600,
      onComplete: () => t.destroy(),
    });
  }

  // ─── 게임오버 ────────────────────────────────────────────────
  async _triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;

    this.cameras.main.shake(300, 0.015);
    this.sound_.playGameOver();
    this.sound_.destroy();

    this.player.die();
    this.touchControls?.destroy();
    this.cameras.main.stopFollow();

    if (this.user) {
      try {
        const username = await authService.getUsername(this.user.id) || '플레이어';
        await Promise.all([
          gameService.submitScore(this.user.id, username, this.score, this.level),
          gameService.updateSave(this.user.id, this.score, this.level),
        ]);
      } catch (e) {
        console.warn('점수 저장 실패:', e.message);
      }
    }

    this.time.delayedCall(1000, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', { score: this.score, level: this.level, user: this.user });
    });
  }
}
