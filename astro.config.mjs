// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

import icon from 'astro-icon';

import mdx from '@astrojs/mdx';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), icon({
    include: {
      noto: [
        'black-nib',
        'identification-card',
        'memo',
        'hamburger',
        'person-climbing',
        'parachute',
      ],
      "fa-brands": [
          '*',
      ]
    },
  }), mdx(), react()],
  vite: {
    assetsInclude: ["**/*.bin", "**/*.zip"],
  },
  site: 'https://www.scottyob.com/',
});