import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' → 빌드 결과(dist)를 아무 폴더에 두어도 열리게 상대 경로로 만들어요.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { assetsInlineLimit: 0 },
});
