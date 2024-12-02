// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';
// 2. Define your collection(s)
const blogCollection = defineCollection({
    type: "content",
    schema: z.object({
        // TODO:  Consider expanding with some examples of https://docs.astro.build/en/guides/content-collections/#defining-datatypes-with-zod
        title: z.string(),
        tags: z.array(z.string()).optional(),
        image: z.string().optional(),
    })
});
// 3. Export a single `collections` object to register your collection(s)
//    This key should match your collection directory name in "src/content"
export const collections = {
  'posts': blogCollection,
};