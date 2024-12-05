import {
  getCollection,
  type CollectionEntry,
  type InferEntrySchema,
} from 'astro:content';

export interface Recipe {
  content: CollectionEntry<'recipes'>;
  data: InferEntrySchema<'recipes'>;
  slug: string,
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const allRecipes = await getCollection('recipes');

  const pages = await Promise.all(
    allRecipes.map(async (post) => {
      if (!post.data.style) {
        post.data.style = 'img-top';
      }

      return {
        content: post,
        data: post.data,
        slug: post.data.title.toLocaleLowerCase().replaceAll(" ", "-"),
      };
    })
  );
  return pages.sort((a, b) => a.data.title.localeCompare(b.data.title));
}
