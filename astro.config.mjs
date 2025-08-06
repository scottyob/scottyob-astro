// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

import icon from 'astro-icon';

import mdx from '@astrojs/mdx';

import react from '@astrojs/react';

import { viteStaticCopy } from 'vite-plugin-static-copy'
const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumBaseUrl = "cesiumStatic";

import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

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
      "flat-color-icons": [
        "data-sheet",
      ],
      "mdi": [
        "resume",
      ],
    },
  }), mdx({
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap', properties: { class: 'markdown-anchor' }}] // This is a rehype plugin
    ]

  }), react()],
  vite: {
    assetsInclude: ["**/*.bin", "**/*.zip"],
    define: {
      CESIUM_BASE_URL: JSON.stringify('/' + cesiumBaseUrl),
    },

    plugins: [
      viteStaticCopy({
        targets: [
          { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
          { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
          { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
          { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
        ],
      }),
    ],
  },
  site: 'https://www.scottyob.com/',
  
});