// Opt-in upstream Markdown helpers; core catalog entries retain their own dependencies.
export {
  default,
  escapeHtmlInTextNodes,
  escapeMarkdownInMdxJsxTextNodes,
  escapeMarkdownInMdxJsxText,
  remarkGfmCustom,
  normalizeCJKCharacters,
} from 'gt-remark';
import type { Plugin } from 'unified';
export declare const preserveEscapedEntities: Plugin;
