import { marked } from 'marked';
import type { Flight } from './flyingTypes';

export function getExcerpt(flight: Flight, length = 100, url?: string): string {
  if(!flight.comments) {
    return '';
  };
  const content = flight.comments.trim();

  const EXCERPT_SEPARATOR = '{/* --- */}';
  const words = content.split(' ');
  let excerpt = content.split(' ').slice(0, length).join(' ');

  if (words.length >= length) {
    // If the content is longer than the specified length,
    // Add an ellipsis markdown link to the full content
    if(url) {
      excerpt += `[...](${url})`;
    } else {
      excerpt += '...';
    }
  }

  if (content.includes(EXCERPT_SEPARATOR)) {
    excerpt = content.split(EXCERPT_SEPARATOR)[0].trim();
  }

  excerpt = excerpt.replace(/^(import.*)\s*$/gm, '');
  return marked.parse(excerpt) as string;
}
