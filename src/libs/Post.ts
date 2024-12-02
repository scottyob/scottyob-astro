import { getCollection } from 'astro:content';
import { marked } from 'marked';

const EXCERPT_SEPERATOR = '{/* --- */}';

function getExcerpt(content: string, length=100) {
    let excerpt = content.split(' ').slice(0, length).join(' ') + '...';
    if(content.includes(EXCERPT_SEPERATOR)) {
        excerpt = content.split(EXCERPT_SEPERATOR)[0].trim();
    }
    
    return marked.parse(excerpt);
}

export async function getAllPosts() {
    const allBlogPosts = (await getCollection('posts'));

    const pages = await Promise.all(allBlogPosts.map(async (post) => {
        const renderedContent = await post.render();

        return {
            "content": renderedContent,
            "data": post.data,
            "excerpt": getExcerpt(post.body),
            "slug": post.slug,
        }
    }))

    return pages;
}



