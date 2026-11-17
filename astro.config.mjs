// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dissect-project.github.io',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    // Keep CSS in files so the CSP can forbid inline styles.
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Never inline scripts/assets as data: or inline <script>; keeps CSP strict.
      assetsInlineLimit: 0,
    },
  },
  devToolbar: { enabled: false },
});
