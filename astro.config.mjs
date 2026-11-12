// @ts-check
import { defineConfig } from 'astro/config';

// Static output, no adapter: the build is plain files any host can serve.
// Add a host adapter (e.g. @astrojs/vercel) only when a server route is needed.
export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
});
