// 1. Import utilities from `astro:content`
import { defineCollection, z, type ImageFunction } from 'astro:content';

// Define common styles
const ArticleStyles: readonly [string, ...string[]] = [
  'img-left',
  'img-top',
  'img-between',
];

// Define a base schema with common fields
const baseSchema = (image: ImageFunction) =>
  z.object({
    title: z.string(),
    description: z.string().optional(),
    hero: image().optional(),
    style: z.enum(ArticleStyles).default('img-left'),
    heroObjectPosition: z.string().optional(),
  });

// 2. Define your collection(s)
const blogCollection = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    baseSchema(image).extend({
      tags: z.array(z.string()).optional(),
      date: z.date(),
      forceHeroOnTop: z.boolean().optional(),
      draft: z.boolean().optional(),
    }),
});

// Recipe collection
const recipeCollection = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    baseSchema(image).extend({
      categories: z.array(z.string()).optional(),
    }),
});

const baseCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => baseSchema(image),
});

// 3. Export a single `collections` object to register your collection(s)
export const collections = {
  posts: blogCollection,
  recipes: recipeCollection,
  base: baseCollection, // Used for layouts that can handle base content
};
