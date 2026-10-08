// Vite/Rollup plugin emits reviewable catalogs, with optional JSX translation.
import { parseSource } from './extract.js';
import { extractProject } from './extract-project.js';
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
      files.set(id, output?.code || code);
      return output ? { code: output.code, map: output.map } : null;
    },
    async generateBundle() {
      const resolveImport = await bundlerImports(this, files);
      const manifest = extractProject(Object.fromEntries(files), {
        resolveImport,
      });
      if (manifest.diagnostics.length) {
        this.error(JSON.stringify(manifest.diagnostics));
      }
      const { messages } = manifest;
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

async function bundlerImports(context, files) {
  const resolved = new Map();
  if (context.resolve) {
    for (const [file, code] of files) {
      for (const statement of parseSource(code, file).program.body) {
        const source = statement.source?.value;
        if (!source) {
          continue;
        }
        const target = await context.resolve(source, file, { skipSelf: true });
        if (target && !target.external && files.has(target.id)) {
          resolved.set(`${file}\0${source}`, target.id);
        }
      }
    }
  }
  return (source, file) => resolved.get(`${file}\0${source}`);
}
