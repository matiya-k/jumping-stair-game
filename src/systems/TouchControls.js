import { GAME } from '../data/constants.js';

/**
 * 모바일 터치 조작
 * 화면 왼쪽 절반 = 왼쪽 이동, 오른쪽 절반 = 오른쪽 이동
 * 위쪽 스와이프 / 탭 = 점프
 */
export class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.left = false;
    this.right = false;
    this.jump = false;

    this._visible = false;
    this._startY = null;
    this._activePointerId = null;

    this._createUI();
    this._bindEvents();
  }

  _createUI() {
    // 왼쪽 버튼
    this._leftBtn = this.scene.add.graphics().setScrollFactor(0).setDepth(10);
    this._leftBtn.fillStyle(0xffffff, 0.12);
    this._leftBtn.fillRoundedRect(16, GAME.HEIGHT - 110, 90, 90, 18);
    this._leftLabel = this.scene.add.text(61, GAME.HEIGHT - 65, '◀', {
      fontSize: '28px', fill: '#ffffff', alpha: 0.5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    // 오른쪽 버튼
    this._rightBtn = this.scene.add.graphics().setScrollFactor(0).setDepth(10);
    this._rightBtn.fillStyle(0xffffff, 0.12);
    this._rightBtn.fillRoundedRect(120, GAME.HEIGHT - 110, 90, 90, 18);
    this._rightLabel = this.scene.add.text(165, GAME.HEIGHT - 65, '▶', {
      fontSize: '28px', fill: '#ffffff', alpha: 0.5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    // 점프 버튼
    this._jumpBtn = this.scene.add.graphics().setScrollFactor(0).setDepth(10);
    this._jumpBtn.fillStyle(0x4a90d9, 0.2);
    this._jumpBtn.fillRoundedRect(GAME.WIDTH - 106, GAME.HEIGHT - 110, 90, 90, 18);
    this._jumpLabel = this.scene.add.text(GAME.WIDTH - 61, GAME.HEIGHT - 65, '▲', {
      fontSize: '28px', fill: '#4a90d9', alpha: 0.7,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    // 기본적으로 숨김 — 터치 감지 시 표시
    this._setVisible(false);
  }

  _bindEvents() {
    const scene = this.scene;

    scene.input.on('pointerdown', (p) => {
      if (!this._visible) this._setVisible(true);
      this._activePointerId = p.id;
      this._startY = p.y;
      this._updateFromPointer(p, true);
    });

    scene.input.on('pointermove', (p) => {
      if (p.id !== this._activePointerId) return;
      this._updateFromPointer(p, true);
    });

    scene.input.on('pointerup', (p) => {
      if (p.id !== this._activePointerId) return;
      this.left = false;
      this.right = false;
      this.jump = false;
      this._activePointerId = null;
      this._resetBtnStyles();
    });
  }

  _updateFromPointer(p, down) {
    const x = p.x;
    const y = p.y;
    const bottomZone = y > GAME.HEIGHT - 130;

    if (bottomZone) {
      // 하단 버튼 영역
      this.left  = x >= 16  && x <= 106;
      this.right = x >= 120 && x <= 210;
      this.jump  = x >= GAME.WIDTH - 106;
    } else {
      // 상단 탭: 위 스와이프로 점프
      if (this._startY !== null && this._startY - y > 30) {
        this.jump = true;
      }
      // 좌우는 화면 절반으로
      this.left  = x < GAME.WIDTH / 2;
      this.right = x >= GAME.WIDTH / 2;
    }

    this._updateBtnStyles();
  }

  _updateBtnStyles() {
    const hl = (g, label, active) => {
      g.clear();
      g.fillStyle(active ? 0xffffff : 0xffffff, active ? 0.28 : 0.12);
      // 재그리기는 간단히 alpha로만
    };
    this._leftLabel.setAlpha(this.left ? 1 : 0.4);
    this._rightLabel.setAlpha(this.right ? 1 : 0.4);
    this._jumpLabel.setAlpha(this.jump ? 1 : 0.5);
  }

  _resetBtnStyles() {
    this._leftLabel.setAlpha(0.4);
    this._rightLabel.setAlpha(0.4);
    this._jumpLabel.setAlpha(0.5);
  }

  _setVisible(v) {
    this._visible = v;
    [this._leftBtn, this._rightBtn, this._jumpBtn,
     this._leftLabel, this._rightLabel, this._jumpLabel]
      .forEach(o => o.setVisible(v));
  }

  // Player.update()에서 isDown 대신 이걸 사용
  isLeft()  { return this.left; }
  isRight() { return this.right; }
  isJump()  { return this.jump; }

  consumeJump() {
    const j = this.jump;
    this.jump = false;
    return j;
  }

  destroy() {
    [this._leftBtn, this._rightBtn, this._jumpBtn,
     this._leftLabel, this._rightLabel, this._jumpLabel]
      .forEach(o => o.destroy());
  }
}
