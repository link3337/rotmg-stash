import path from 'node:path';
import { defineConfig } from 'vitest/config';

const src = path.resolve(__dirname, 'src');

export default defineConfig({
  test: {
    environment: 'node'
  },
  resolve: {
    alias: {
      '@': src,
      '@api': path.resolve(src, 'api'),
      '@cache': path.resolve(src, 'cache'),
      '@components': path.resolve(src, 'components'),
      '@hooks': path.resolve(src, 'hooks'),
      '@pages': path.resolve(src, 'pages'),
      '@providers': path.resolve(src, 'providers'),
      '@realm': path.resolve(src, 'realm'),
      '@store': path.resolve(src, 'store'),
      '@utils': path.resolve(src, 'utils'),
      '@assets': path.resolve(src, 'assets')
    }
  }
});
