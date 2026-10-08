// Vite/Rollup plugin emits reviewable .lino catalogs without rewriting app code.
import { extractMessages } from './extract.js';
import { formatLinoCatalog } from './catalogs.js';

export function createExtractionPlugin({
  locale = 'en',
  catalogFile = `locales/${locale}.lino`,
  manifestFile = 'messages.json',
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
      const manifest = extractMessages(code, { file: id });
      if (manifest.diagnostics.length) {
        this.error(JSON.stringify(manifest.diagnostics));
      }
      files.set(id, manifest.messages);
      return null;
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
