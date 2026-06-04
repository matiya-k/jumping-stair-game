import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages 배포 시 레포 이름으로 변경
  // 예: https://username.github.io/jumping-stair-game/
  base: '/jumping-stair-game/',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
