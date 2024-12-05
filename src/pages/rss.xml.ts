import rss from '@astrojs/rss';
import { type APIContext } from 'astro';
import { getAllPosts } from '@libs/Post';

export async function GET(context: APIContext) {
  console.log(context);

  const blog = await getAllPosts();

  return rss({
    // `<title>` field in output xml
    title: 'Scott O\'Brien’s Website',
    // `<description>` field in output xml
    description: 'Creative outlet for Scott.',
    // Pull in your project "site" from the endpoint context
    // https://docs.astro.build/en/reference/api-reference/#site
    site: context.site?.toString() || 'about:none',
    // Array of `<item>`s in output xml
    // See "Generating items" section for examples using content collections and glob imports
    // add `xmlns:media="http://search.yahoo.com/mrss/"`
    xmlns: {
      media: "http://search.yahoo.com/mrss/",
    },
    items: blog.map((post) => {

      return {
        title: post.data.title,
        pubDate: post.data.date,
        description: post.data?.description,
        link: `/post/${post.slug}`,
        content: post.excerpt,
        customData: (post.data.hero?.format == "jpg" ? `<media:content
          type="image/${post.data.hero.format == "jpg" ? "jpeg" : "png"}"
          width="${post.data.hero.width}"
          height="${post.data.hero.height}"
          medium="image"
          url="${context.site + post.data.hero.src}" />
      ` : undefined),
      };

    }),
    // (optional) inject custom xml
    customData: `<language>en-us</language>`,
    trailingSlash: false,
  });
}
