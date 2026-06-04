import { PLATFORM, GAME } from '../data/constants.js';

export class PlatformManager {
  constructor(scene) {
    this.scene = scene;
    this.group = scene.physics.add.staticGroup();
    this.platforms = [];
    this.highestY = GAME.HEIGHT;
    this.onSpawn = null; // ItemManager에서 훅 등록
  }

  init() {
    // 바닥 플랫폼 (항상 normal, 아이템 없음)
    this._spawnAt(GAME.WIDTH / 2, GAME.HEIGHT - 40, 160, 'normal', false);

    let y = GAME.HEIGHT - 40;
    for (let i = 0; i < PLATFORM.COUNT; i++) {
      y -= Phaser.Math.Between(PLATFORM.MIN_GAP, PLATFORM.MAX_GAP);
      const x = Phaser.Math.Between(60, GAME.WIDTH - 60);
      this._spawnAt(x, y, PLATFORM.WIDTH, this._pickType(), true);
    }
    this.highestY = y;
  }

  update(cameraScrollY) {
    while (this.highestY > cameraScrollY - GAME.HEIGHT) {
      this.highestY -= Phaser.Math.Between(PLATFORM.MIN_GAP, PLATFORM.MAX_GAP);
      const x = Phaser.Math.Between(60, GAME.WIDTH - 60);
      this._spawnAt(x, this.highestY, PLATFORM.WIDTH, this._pickType(), true);
    }

    const removeY = cameraScrollY + GAME.HEIGHT * 1.5;
    this.platforms = this.platforms.filter(p => {
      if (p.sprite.y > removeY) {
        p.sprite.destroy();
        return false;
      }
      return true;
    });

    // moving 플랫폼 이동
    this.platforms.forEach(p => {
      if (p.type === 'moving') {
        p.sprite.x += p.moveDir * 1.5;
        if (Math.abs(p.sprite.x - p.startX) > p.moveRange) {
          p.moveDir *= -1;
        }
        p.sprite.body.reset(p.sprite.x, p.sprite.y);
      }
    });
  }

  getGroup() { return this.group; }

  onLand(platformSprite) {
    const p = this.platforms.find(p => p.sprite === platformSprite);
    if (!p) return;
    if (p.type === 'fragile') {
      this.scene.time.delayedCall(180, () => {
        platformSprite.destroy();
        this.platforms = this.platforms.filter(pl => pl.sprite !== platformSprite);
      });
    }
  }

  _spawnAt(x, y, width, type, tryItem = false) {
    const sprite = this.group.create(x, y, `platform_${type}`);
    sprite.setDisplaySize(width, PLATFORM.HEIGHT);
    sprite.refreshBody();

    const data = {
      sprite,
      type,
      moveDir: Math.random() < 0.5 ? 1 : -1,
      moveRange: Phaser.Math.Between(60, 120),
      startX: x,
    };
    this.platforms.push(data);

    // 아이템 스폰 훅
    if (tryItem && this.onSpawn) {
      this.onSpawn(x, y);
    }

    return data;
  }

  _pickType() {
    const r = Math.random();
    if (r < 0.65) return 'normal';
    if (r < 0.85) return 'moving';
    return 'fragile';
  }
}
