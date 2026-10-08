import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSource } from './extract.js';
import { projectLimits } from './extract-project.js';

const sourceExtension = /\.[cm]?[jt]sx?$/;
const excluded = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  '.output',
  'dist',
  'coverage',
  '__pycache__',
  '.venv',
  'venv',
]);

async function collectDirectory(input, files, budget, depth = 0) {
  if (depth > 50 || ++budget.directories > 10000) {
    throw new Error('Source directory depth/count limit exceeded');
  }
  for (const entry of (await readdir(input, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name)
  )) {
    if (excluded.has(entry.name)) {
      continue;
    }
    const file = path.join(input, entry.name);
    if (entry.isDirectory()) {
      await collectDirectory(file, files, budget, depth + 1);
    } else if (
      entry.isFile() &&
      budget.extension.test(entry.name) &&
      !entry.name.endsWith('.d.ts')
    ) {
      files.push(file);
      if (files.length > budget.maxFiles) {
        throw new Error('Project file limit exceeded');
      }
    }
  }
}

async function resolveDiskImport(file, source, includeVue) {
  const base = path.resolve(path.dirname(file), source);
  const candidates = [
    base,
    ...(/\.[mc]?js$/.test(base)
      ? [base.replace(/js$/, 'ts'), base.replace(/js$/, 'tsx')]
      : [
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
          '.mjs',
          '.mts',
          '.cjs',
          '.cts',
          ...(includeVue ? ['.vue'] : []),
        ].flatMap((extension) => [
          base + extension,
          path.join(base, `index${extension}`),
        ])),
  ];
  const found = [];
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) {
        if (candidate === base) {
          return candidate;
        }
        found.push(candidate);
      }
    } catch (error) {
      if (!['ENOENT', 'ENOTDIR'].includes(error.code)) {
        throw error;
      }
    }
  }
  if (found.length > 1) {
    throw new Error(`Ambiguous local import ${source} in ${file}`);
  }
  return found[0];
}

async function dependencies(code, file, { parser, extension, includeVue }) {
  let ast;
  try {
    ast = parser(code, file);
  } catch {
    return []; // The project extractor reports source syntax with its location.
  }
  const result = [];
  for (const statement of ast.program.body) {
    const source = statement.source?.value;
    if (
      !source?.startsWith('.') ||
      (path.extname(source) && !extension.test(source))
    ) {
      continue;
    }
    const dependency = await resolveDiskImport(file, source, includeVue);
    if (dependency) {
      result.push(dependency);
    }
  }
  return result;
}

function sourceOptions(options) {
  return {
    includeVue: options.includeVue || false,
    extension: options.includePython
      ? /\.py$/
      : options.includeVue
        ? /(?:\.[cm]?[jt]sx?|\.vue)$/
        : sourceExtension,
    parser: options.includePython
      ? () => ({ program: { body: [] } })
      : options.parser || parseSource,
  };
}

export async function readProjectSources(input, options = {}) {
  const limits = projectLimits(options);
  const extraction = sourceOptions(options);
  const absolute = path.resolve(
    input instanceof URL ? fileURLToPath(input) : input
  );
  const single = (await stat(absolute)).isFile();
  const root = single ? path.dirname(absolute) : absolute;
  const files = single ? [absolute] : [];
  if (!single) {
    await collectDirectory(root, files, {
      ...limits,
      ...extraction,
      directories: 0,
    });
  }
  const sources = Object.create(null);
  const visited = new Set();
  let bytes = 0;
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    if (visited.has(file)) {
      continue;
    }
    visited.add(file);
    if (visited.size > limits.maxFiles) {
      throw new Error('Project file limit exceeded');
    }
    bytes += (await stat(file)).size;
    if (bytes > limits.maxBytes) {
      throw new Error('Project byte limit exceeded');
    }
    const code = await readFile(file, 'utf8');
    sources[path.relative(root, file).replaceAll('\\', '/')] = code;
    if (single) {
      files.push(
        ...(await dependencies(code, file, extraction)).filter(
          (dependency) => !visited.has(dependency)
        )
      );
    }
  }
  return sources;
}
