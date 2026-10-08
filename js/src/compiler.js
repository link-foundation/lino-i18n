// Vite/Rollup plugin emits reviewable catalogs, with optional JSX translation.
import { extractMessages } from './extract.js';
import { formatLinoCatalog } from './catalogs.js';
import { transformJSX } from './transform-jsx.js';

export { transformJSX };

export function createExtractionPlugin({
  locale = 'en',
  catalogFile = `locales/${locale}.lino`,
  manifestFile = 'messages.json',
  transform,
} = {}) {
  const files = new Map();
  return {
    name: 'lino-i18n-extract',
    enforce: 'pre',
    buildStart() {
      files.clear();
    },
    transform(code, id) {
      if (!/\.[cm]?[jt]sx?(?:\?|$)/.test(id) || id.includes('/node_modules/')) {
        return null;
      }
      const output = transform
        ? transformJSX(code, { ...transform, file: id })
        : null;
      const manifest = extractMessages(output?.code || code, { file: id });
      if (manifest.diagnostics.length) {
        this.error(JSON.stringify(manifest.diagnostics));
      }
      files.set(id, manifest.messages);
      return output ? { code: output.code, map: output.map } : null;
    },
    generateBundle() {
      const entries = new Map();
      for (const messages of files.values()) {
        for (const entry of messages) {
          if (
            entries.has(entry.id) &&
            entries.get(entry.id).source !== entry.source
          ) {
            this.error(`Conflicting source messages for id ${entry.id}`);
          }
          entries.set(entry.id, entry);
        }
      }
      const messages = [...entries.values()].sort((a, b) =>
        a.id.localeCompare(b.id)
      );
      this.emitFile({
        type: 'asset',
        fileName: catalogFile,
        source: `${formatLinoCatalog(locale, Object.fromEntries(messages.map(({ id, source }) => [id, source])))}\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: manifestFile,
        source: `${JSON.stringify({ version: 1, messages }, null, 2)}\n`,
      });
    },
  };
}
