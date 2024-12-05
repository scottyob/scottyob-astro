import { getCollection, type CollectionEntry, type InferEntrySchema } from 'astro:content';
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
    const allBlogPosts = (await getCollection('posts')).filter(p => !p.data.draft);

    const pages = await Promise.all(allBlogPosts.map(async (post) => {
        if (!post.data.style) {
            post.data.style = "img-left";
        }

        if (post.data.draft) {
            console.log("Yeah");
        }

        return {
            "content": post,
            "data": post.data,
            "excerpt": await getExcerpt(post.body),
            "slug": post.slug.replace(/\/page$/, ""),
        }
    }))

    return pages.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}



