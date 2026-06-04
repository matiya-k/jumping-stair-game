import { ITEMS, GAME } from '../data/constants.js';

// 아이템 종류별 설정
const ITEM_DEFS = {
  jump:   { color: 0xffdd00, label: '↑', desc: '점프 강화', duration: 5000 },
  speed:  { color: 0xff6600, label: '▶', desc: '속도 부스트', duration: 4000 },
  shield: { color: 0x44aaff, label: '◆', desc: '무적', duration: 6000 },
  coin:   { color: 0xffd700, label: '●', desc: '보너스 점수', duration: 0 },
};

export class ItemManager {
  constructor(scene) {
    this.scene = scene;
    this.group = scene.physics.add.group();
    this.items = []; // { sprite, type }
  }

  // 플랫폼 위에 아이템 스폰 시도
  trySpawnOn(platformX, platformY) {
    if (Math.random() > ITEMS.SPAWN_CHANCE) return;

    const types = ['jump', 'speed', 'shield', 'coin', 'coin']; // 코인 확률 높게
    const type = types[Math.floor(Math.random() * types.length)];
    this._spawn(platformX, platformY - 24, type);
  }

  _spawn(x, y, type) {
    const def = ITEM_DEFS[type];
    const key = `item_${type}`;

    // 텍스처 없으면 생성
    if (!this.scene.textures.exists(key)) {
      this._createTexture(type, def);
    }

    const sprite = this.group.create(x, y, key);
    sprite.setImmovable(true);
    sprite.body.allowGravity = false;

    // 둥실둥실 애니메이션
    this.scene.tweens.add({
      targets: sprite,
      y: y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.items.push({ sprite, type });
    return sprite;
  }

  _createTexture(type, def) {
    const key = `item_${type}`;
    const g = this.scene.make.graphics({ x: 0, y: 0, add: false });

    if (type === 'coin') {
      // 코인 — 황금 원
      g.fillStyle(0xffd700);
      g.fillCircle(12, 12, 10);
      g.fillStyle(0xffec6e);
      g.fillCircle(10, 9, 4);
    } else {
      // 파워업 — 둥근 사각형 + 아이콘
      g.fillStyle(def.color, 0.9);
      g.fillRoundedRect(0, 0, 24, 24, 6);
      g.fillStyle(0xffffff, 0.3);
      g.fillRoundedRect(2, 2, 20, 10, 4);
    }

    g.generateTexture(key, 24, 24);
    g.destroy();

    // 텍스트 라벨은 스프라이트 위에 별도로 그림 (GameScene에서 처리)
  }

  // 플레이어 충돌 체크 및 수집 처리
  setupOverlap(playerSprite, onCollect) {
    this.scene.physics.add.overlap(
      playerSprite,
      this.group,
      (player, itemSprite) => {
        const entry = this.items.find(i => i.sprite === itemSprite);
        if (!entry) return;

        onCollect(entry.type);
        this._collect(entry);
      }
    );
  }

  _collect(entry) {
    const { sprite, type } = entry;

    // 수집 파티클 효과
    this._burst(sprite.x, sprite.y, ITEM_DEFS[type].color);

    // 트윈 제거 후 스프라이트 파괴
    this.scene.tweens.killTweensOf(sprite);
    sprite.destroy();
    this.items = this.items.filter(i => i !== entry);
  }

  _burst(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dot = this.scene.add.circle(x, y, 4, color);
      this.scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 400,
        onComplete: () => dot.destroy(),
      });
    }
  }

  // 화면 밖으로 벗어난 아이템 정리
  cleanup(cameraScrollY) {
    const removeY = cameraScrollY + GAME.HEIGHT * 1.5;
    this.items = this.items.filter(({ sprite }) => {
      if (sprite.y > removeY) {
        this.scene.tweens.killTweensOf(sprite);
        sprite.destroy();
        return false;
      }
      return true;
    });
  }

  getDef(type) {
    return ITEM_DEFS[type];
  }
}
