import rss from '@astrojs/rss';
import { type APIContext } from 'astro';
import { getAllPosts } from '@libs/Post';

export async function GET(context: APIContext) {
  const blog = await getAllPosts();
  const siteUrl = context.site?.toString() || 'about:none';

  return rss({
    // `<title>` field in output xml
    title: "Scott O'Brien's Website",
    // `<description>` field in output xml
    description: 'Creative outlet for Scott.',
    // Pull in your project "site" from the endpoint context
    // https://docs.astro.build/en/reference/api-reference/#site
    site: siteUrl,
    // Array of `<item>`s in output xml
    // See "Generating items" section for examples using content collections and glob imports
    // add `xmlns:media="http://search.yahoo.com/mrss/"`
    xmlns: {
      media: "http://search.yahoo.com/mrss/",
    },
    items: blog.map((post) => {
      const heroFormat = post.data.hero?.format;
      const mediaContent = heroFormat === "jpg" || heroFormat === "png" 
        ? `<media:content
            type="image/${heroFormat === "jpg" ? "jpeg" : "png"}"
            width="${post.data.hero?.width}"
            height="${post.data.hero?.height}"
            medium="image"
            url="${siteUrl}${post.data.hero?.src}" />`
        : undefined;

      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data.description || '',
        link: `/post/${post.slug}`,
        content: String(post.excerpt || ''),
        customData: mediaContent,
      };
    }),
    // (optional) inject custom xml
    customData: `<language>en-us</language>`,
    trailingSlash: false,
  });
}
