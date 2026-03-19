import { LinkItem } from './types';

export function injectLinks(
  text: string | null | undefined,
  links: LinkItem[],
  limit = 2
): string {
  if (!text) return "";
  if (!links || links.length === 0) return text;
  
  let output = text;
  let count = 0;

  for (const link of links) {
    if (count >= limit) break;
    if (!link.anchor) continue;

    const regex = new RegExp(`\\b${link.anchor}\\b`, "i");

    if (regex.test(output)) {
      output = output.replace(
        regex,
        `<a href="${link.path}" class="text-hvac-blue hover:text-blue-800 hover:underline font-medium transition-colors">${link.anchor}</a>`
      );
      count++;
    }
  }

  return output;
}
