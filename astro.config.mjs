// @ts-check
import { defineConfig } from 'astro/config';
import lottie from 'astro-integration-lottie';

import icon from 'astro-icon';

import mdx from '@astrojs/mdx';

import react from '@astrojs/react';

import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

// https://astro.build/config
export default defineConfig({
  integrations: [lottie(), icon({
    include: {
      noto: [
        'black-nib',
        'identification-card',
        'memo',
        'hamburger',
        'person-climbing',
        'parachute',
      ],
      'flat-color-icons': [
        'data-sheet',
      ],
      mdi: [
        'resume',
      ],
    },
  }), mdx({
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { class: 'markdown-anchor' }}] // This is a rehype plugin
    ]

  }), react()],
  vite: {
    assetsInclude: ['**/*.bin', '**/*.zip', '**/*.json.lottie'],
    server: {
      allowedHosts: ['scotts-macbook-air.mackarel-in.ts.net'],
    },
  },
  site: 'https://www.scottyob.com/',
  
});
