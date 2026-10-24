import { defineConfig } from 'vitest/config';

export default defineConfig({
  // GitHub Pages ではサブパス（/glb/）で公開されるので、相対パスで出力する
  base: './',
  test: {
    include: ['test/**/*.test.ts'],
  },
});
