import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { AuthScene } from './scenes/AuthScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { LeaderboardScene } from './scenes/LeaderboardScene.js';

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 640,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    AuthScene,
    TitleScene,
    GameScene,
    UIScene,
    PauseScene,
    GameOverScene,
    LeaderboardScene,
  ],
};

new Phaser.Game(config);
