import { PLAYER, ITEMS } from '../data/constants.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;

    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(28, 30);

    // 키보드
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // 터치 (GameScene에서 주입)
    this.touch = null;

    this.isAlive = true;

    this._powerUps = {
      jump:   { active: false, timer: null },
      speed:  { active: false, timer: null },
      shield: { active: false, timer: null },
    };
  }

  update() {
    if (!this.isAlive) return;

    const body = this.sprite.body;
    const onGround = body.blocked.down;

    // 이동 방향 결정 (키보드 우선, 없으면 터치)
    const goLeft  = this.cursors.left.isDown  || this.wasd.left.isDown
                  || (this.touch?.isLeft() && !this.cursors.right.isDown && !this.wasd.right.isDown);
    const goRight = this.cursors.right.isDown || this.wasd.right.isDown
                  || (this.touch?.isRight() && !this.cursors.left.isDown && !this.wasd.left.isDown);

    const speed = this._powerUps.speed.active ? PLAYER.SPEED * 1.6 : PLAYER.SPEED;

    if (goLeft) {
      this.sprite.setVelocityX(-speed);
      this.sprite.setFlipX(true);
    } else if (goRight) {
      this.sprite.setVelocityX(speed);
      this.sprite.setFlipX(false);
    } else {
      this.sprite.setVelocityX(0);
    }

    // 화면 가장자리 통과
    if (this.sprite.x < 0)                      this.sprite.x = this.scene.scale.width;
    if (this.sprite.x > this.scene.scale.width)  this.sprite.x = 0;

    // 점프
    const jumpVel = this._powerUps.jump.active ? PLAYER.JUMP_VELOCITY * 1.3 : PLAYER.JUMP_VELOCITY;
    const kbJump  = Phaser.Input.Keyboard.JustDown(this.cursors.up)
                  || Phaser.Input.Keyboard.JustDown(this.cursors.space)
                  || Phaser.Input.Keyboard.JustDown(this.wasd.up);
    const touchJump = this.touch?.consumeJump() ?? false;

    if ((kbJump || touchJump) && onGround) {
      this.sprite.setVelocityY(jumpVel);
    }

    // 파워업 색상
    if (this._powerUps.shield.active) {
      this.sprite.setTint(0x44aaff);
    } else if (this._powerUps.jump.active) {
      this.sprite.setTint(0xffdd00);
    } else if (this._powerUps.speed.active) {
      this.sprite.setTint(0xff6600);
    } else {
      this.sprite.clearTint();
    }
  }

  applyPowerUp(type) {
    if (type === 'coin') return;
    const pu = this._powerUps[type];
    if (!pu) return;
    if (pu.timer) pu.timer.remove();
    pu.active = true;
    const durations = { jump: ITEMS.JUMP_BOOST_DURATION, speed: ITEMS.SPEED_BOOST_DURATION, shield: ITEMS.SHIELD_DURATION };
    pu.timer = this.scene.time.delayedCall(durations[type] || 5000, () => {
      pu.active = false;
      pu.timer = null;
    });
  }

  isShielded() { return this._powerUps.shield.active; }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  die() {
    this.isAlive = false;
    this.sprite.setTint(0xff4444);
    this.sprite.body.setGravityY(0);
    this.sprite.setVelocity(0, -80);
    this.scene.tweens.add({
      targets: this.sprite,
      angle: 360,
      alpha: 0,
      duration: 700,
    });
  }
}
