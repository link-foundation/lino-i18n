// Opt-in upstream Markdown helpers; core catalog entries retain their own dependencies.
export {
  default,
  escapeHtmlInTextNodes,
  escapeMarkdownInMdxJsxTextNodes,
  escapeMarkdownInMdxJsxText,
  remarkGfmCustom,
  normalizeCJKCharacters,
} from 'gt-remark';

// remark-stringify escapes entity ampersands produced by GT's AST helpers.
// Retain valid character references while preserving its other text escaping.
export function preserveEscapedEntities() {
  const data = this.data();
  const extensions =
    data.toMarkdownExtensions || (data.toMarkdownExtensions = []);
  extensions.push({
    handlers: {
      text(node, parent, state, info) {
        const siblings = parent?.children || [];
        const index = siblings.indexOf(node);
        return state
          .safe(node.value, {
            ...info,
            afterNode: siblings[index + 1],
            beforeNode: siblings[index - 1],
          })
          .replace(
            /\\(&(?:#[0-9]+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);)/g,
            '$1'
          );
      },
    },
  });
}
