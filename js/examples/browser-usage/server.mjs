// Serve the JS package so the example can import native ES modules directly.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { resolve, extname, sep } from 'node:path';

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
    const body = await readFile(filePath);
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
