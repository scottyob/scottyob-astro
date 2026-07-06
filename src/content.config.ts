import { defineCollection, type ImageFunction } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const ArticleStyles: readonly [string, ...string[]] = [
  'img-left',
  'img-top',
  'img-between',
];

const baseSchema = (image: ImageFunction) =>
  z.object({
    title: z.string(),
    description: z.string().optional(),
    hero: image().optional(),
    style: z.enum(ArticleStyles).default('img-left'),
    heroObjectPosition: z.string().optional(),
  });

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/posts' }),
  schema: ({ image }) =>
    baseSchema(image).extend({
      tags: z.array(z.string()).optional(),
      date: z.date(),
      forceHeroOnTop: z.boolean().optional(),
      draft: z.boolean().optional(),
    }),
});

const recipeCollection = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/recipes' }),
  schema: ({ image }) =>
    baseSchema(image).extend({
      categories: z.array(z.string()).optional(),
    }),
});

export const collections = {
  posts: blogCollection,
  recipes: recipeCollection,
};
