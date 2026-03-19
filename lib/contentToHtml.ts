/**
 * Convert generated content JSON to HTML.
 * Used by canary batch for testing; re-exports renderToHtml.
 */

import { renderToHtml } from './ai-generator';

export function contentToHtml(data: Record<string, unknown>): string {
  return renderToHtml(data);
}
