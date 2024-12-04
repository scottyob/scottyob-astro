import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { getCollection, type CollectionEntry, type InferEntrySchema, type Render } from 'astro:content';
import { marked } from 'marked';

const EXCERPT_SEPERATOR = '{/* --- */}';

function getExcerpt(content: string, length = 100) {
    let excerpt = content.split(' ').slice(0, length).join(' ') + '...';
    if (content.includes(EXCERPT_SEPERATOR)) {
        excerpt = content.split(EXCERPT_SEPERATOR)[0].trim();
    }

    excerpt = excerpt.replace(/^(import.*)\s*$/gm, "");
    return marked.parse(excerpt);
}

export interface Post {
    content: CollectionEntry<'posts'>,
    data: InferEntrySchema<'posts'>,
    excerpt: string | Promise<string>,
    slug: string
}

export async function getAllPosts(): Promise<Post[]> {
    const allBlogPosts = (await getCollection('posts'));

    const pages = await Promise.all(allBlogPosts.map(async (post) => {

        return {
            "content": post,
            "data": post.data,
            "excerpt": getExcerpt(post.body),
            "slug": post.slug.replace(/\/page$/, ""),
        }
    }))



    return pages.sort((a, b) => b.data.date.getTime() - a.data.date.getTime() );
}



