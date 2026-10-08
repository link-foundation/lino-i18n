// Render the same Currency children against the archived and fixed adapters.
// Start examples/browser-usage/server.mjs after generating these fixtures.
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const before = execFileSync('git', ['show', '0d70b71:js/src/react.js'], {
  cwd: root,
  encoding: 'utf8',
});
for (const version of ['before', 'after']) {
  const outdir = resolve(root, 'dist/issue-25-currency', version);
  await mkdir(outdir, { recursive: true });
  const result = await build({
    entryPoints: [resolve(root, 'examples/react-usage/app.js')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    plugins:
      version === 'before'
        ? [
            {
              name: 'archived-currency-adapter',
              setup(builder) {
                builder.onLoad({ filter: /[/\\]src[/\\]react\.js$/ }, () => ({
                  contents: before,
                  resolveDir: resolve(root, 'src'),
                  loader: 'js',
                }));
              },
            },
          ]
        : [],
  });
  await writeFile(resolve(outdir, 'bundle.js'), result.outputFiles[0].text);
  for (const file of ['index.html', 'en.lino', 'fr.lino']) {
    await copyFile(
      resolve(root, 'examples/react-usage', file),
      resolve(outdir, file)
    );
  }
  console.log(`http://127.0.0.1:4173/dist/issue-25-currency/${version}/`);
}
