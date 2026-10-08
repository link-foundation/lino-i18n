// Serve the JS package so the example can import native ES modules directly.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { build } from 'esbuild';
import { transformJSX } from '../../src/compiler.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.lino': 'text/plain',
};
const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const pathname = url.pathname.endsWith('/')
    ? `${url.pathname}index.html`
    : url.pathname;
  const filePath = resolve(root, `.${decodeURIComponent(pathname)}`);
  if (!filePath.startsWith(root.endsWith(sep) ? root : `${root}${sep}`)) {
    response.writeHead(403).end();
    return;
  }
  try {
    if (
      [
        '/examples/react-usage/bundle.js',
        '/examples/compiler-usage/bundle.js',
        '/examples/vue-usage/bundle.js',
        '/examples/native-usage/bundle.js',
      ].includes(url.pathname)
    ) {
      const compiled = url.pathname.includes('compiler-usage');
      const vue = url.pathname.includes('vue-usage');
      const example = url.pathname.split('/')[2];
      const result = await build({
        entryPoints: [
          resolve(root, `examples/${example}/app.${compiled ? 'jsx' : 'js'}`),
        ],
        bundle: true,
        format: 'esm',
        platform: 'browser',
        write: false,
        define: vue
          ? {
              __VUE_OPTIONS_API__: 'true',
              __VUE_PROD_DEVTOOLS__: 'false',
              __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true',
            }
          : {},
        plugins: compiled
          ? [
              {
                name: 'lino-transform',
                setup(build) {
                  build.onLoad(
                    { filter: /compiler-usage\/app\.jsx$/ },
                    async ({ path }) => ({
                      contents: transformJSX(await readFile(path, 'utf8'), {
                        file: path,
                        attributeTranslator: 'gt',
                        attributes: ['placeholder', 'aria-label'],
                      }).code,
                      loader: 'jsx',
                    })
                  );
                },
              },
            ]
          : [],
      });
      response
        .writeHead(200, { 'Content-Type': 'text/javascript' })
        .end(result.outputFiles[0].text);
      return;
    }
    let body = await readFile(filePath);
    if (pathname === '/examples/vue-usage/index.html') {
      const { createSSRApp } = await import('vue');
      const { renderToString } = await import('@vue/server-renderer');
      const { createVueI18n } = await import('../../src/vue.js');
      const { App, locales } = await import('../vue-usage/shared.js');
      const locale = url.searchParams.get('locale') === 'fr' ? 'fr' : 'en';
      const plugin = createVueI18n({ defaultLocale: locale, locales });
      const content = await renderToString(createSSRApp(App).use(plugin));
      const snapshot = JSON.stringify(plugin.i18n.snapshot()).replaceAll(
        '<',
        '\\u003c'
      );
      body = body
        .toString()
        .replace('<html lang="en">', `<html lang="${locale}">`)
        .replace(
          '<div id="app"></div>',
          `<div id="app">${content}</div><script>window.__LINO_SNAPSHOT__=${snapshot}</script>`
        );
    }
    response.writeHead(200, {
      'Content-Type': types[extname(filePath)] || 'application/octet-stream',
    });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});

server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => {
  console.log(
    `Browser example: http://127.0.0.1:${server.address().port}/examples/browser-usage/`
  );
});
