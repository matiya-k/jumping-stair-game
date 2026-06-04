export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Phase 5+에서 실제 에셋 로드 예정
  }

  create() {
    // AuthScene에서 로그인 → TitleScene → GameScene 흐름
    this.scene.start('AuthScene');
  }
}
