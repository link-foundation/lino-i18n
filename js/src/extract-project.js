import path from 'node:path';
import babelTraverse from '@babel/traverse';
import { extractMessages, parseSource, valueApi } from './extract.js';

const traverse = babelTraverse.default || babelTraverse;
const extensions = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.mts',
  '.cjs',
  '.cts',
];
const library =
  /^lino-i18n(?:\/(?:messages|react|rrweb|react-native|react-server|server|node|vue|(?:next|tanstack-start)\/(?:server|client)))?$/;

export function projectLimits({
  maxFiles = 1000,
  maxBytes = 10 * 1024 * 1024,
} = {}) {
  if (
    !Number.isInteger(maxFiles) ||
    maxFiles < 1 ||
    maxFiles > 10000 ||
    !Number.isInteger(maxBytes) ||
    maxBytes < 1 ||
    maxBytes > 100 * 1024 * 1024
  ) {
    throw new Error(
      'Project limits must be positive integers (up to 10000 files and 100 MiB)'
    );
  }
  return { maxFiles, maxBytes };
}

export function resolveSourceFile(files, file, source) {
  if (!source.startsWith('.')) {
    return undefined;
  }
  const base = path.posix.normalize(
    path.posix.join(path.posix.dirname(file), source)
  );
  if (files.has(base)) {
    return base;
  }
  const candidates = /\.[mc]?js$/.test(base)
    ? [base.replace(/js$/, 'ts'), base.replace(/js$/, 'tsx')]
    : extensions.flatMap((extension) => [
        base + extension,
        `${base}/index${extension}`,
      ]);
  const matches = candidates.filter((candidate) => files.has(candidate));
  if (matches.length > 1) {
    throw new Error(
      `Ambiguous local import ${source} in ${file}: ${matches.join(', ')}`
    );
  }
  return matches[0];
}

function exportTable(program) {
  const named = new Map();
  const stars = [];
  for (const statement of program.get('body')) {
    if (statement.isExportDefaultDeclaration()) {
      const declaration = statement.get('declaration');
      named.set(
        'default',
        declaration.isIdentifier()
          ? exportBinding(program, declaration.node.name)
          : declaration
      );
    } else if (statement.isExportAllDeclaration()) {
      stars.push(statement.node.source.value);
    } else if (statement.isExportNamedDeclaration()) {
      namedExports(program, statement, named);
    }
  }
  return { named, stars };
}

function exportBinding(program, name) {
  const binding = program.scope.getBinding(name);
  if (
    binding?.path.isVariableDeclarator() &&
    binding.path.node.id.type === 'ObjectPattern'
  ) {
    return binding.path
      .get('id.properties')
      .find((property) => property.node.value?.name === name)
      ?.get('value');
  }
  return binding?.path;
}

function namedExports(program, statement, named) {
  const { declaration, source, specifiers } = statement.node;
  if (declaration) {
    for (const name of Object.keys(
      statement.get('declaration').getBindingIdentifiers()
    )) {
      named.set(name, exportBinding(program, name));
    }
  }
  for (const specifier of specifiers) {
    const name = specifier.exported.name ?? specifier.exported.value;
    named.set(
      name,
      source
        ? {
            source: source.value,
            name:
              specifier.type === 'ExportNamespaceSpecifier'
                ? '*'
                : (specifier.local.name ?? specifier.local.value),
          }
        : exportBinding(program, specifier.local.name)
    );
  }
}

function createResolver(modules, resolveImport) {
  const files = new Set(modules.keys());
  function imported(file, source, name, seen) {
    if (['react-native', 'react-native-web'].includes(source)) {
      return name === '*'
        ? { api: 'native-module' }
        : name === 'Text'
          ? { api: 'NativeText' }
          : undefined;
    }
    if (library.test(source)) {
      return { api: name };
    }
    const target =
      resolveImport?.(source, file) || resolveSourceFile(files, file, source);
    if (target && !files.has(target)) {
      throw new Error(
        `Resolved import ${source} is absent from project sources: ${target}`
      );
    }
    return (
      target &&
      (name === '*' ? namespace(target) : exported(target, name, seen))
    );
  }
  function namespace(file) {
    return {
      resolve: (name, seen) => exported(file, name, seen),
      resolveApi(name, seen) {
        const value = exported(file, name, seen);
        return value?.api || (value?.node && valueApi(value, value.node, seen));
      },
    };
  }
  function exported(file, name, seen) {
    const key = `${file}:${name}`;
    if (seen.has(key) || seen.size > 100) {
      return undefined;
    }
    const next = new Set(seen).add(key);
    const module = modules.get(file);
    if (module.exports.named.has(name)) {
      const value = module.exports.named.get(name);
      return value?.source
        ? imported(file, value.source, value.name, next)
        : value;
    }
    if (name === 'default') {
      return undefined;
    }
    const values = module.exports.stars
      .map((source) => imported(file, source, name, next))
      .filter(Boolean);
    const unique = [...new Set(values)];
    if (
      unique.length > 1 &&
      !unique.every((value) => value.api && value.api === unique[0].api)
    ) {
      throw new Error(`Ambiguous exported name ${name} in ${file}`);
    }
    return unique[0];
  }
  return (file) => (binding, seen) =>
    imported(
      file,
      binding.parent.source.value,
      binding.isImportNamespaceSpecifier()
        ? '*'
        : binding.isImportDefaultSpecifier()
          ? 'default'
          : (binding.node.imported.name ?? binding.node.imported.value),
      seen
    );
}

function parseModules(sources, limits, diagnostics, parser) {
  const modules = new Map();
  const entries = Object.entries(sources);
  if (entries.length > limits.maxFiles) {
    throw new Error('Project file limit exceeded');
  }
  let bytes = 0;
  for (const [file, code] of entries) {
    if (typeof code !== 'string') {
      throw new TypeError(
        'Project sources must map file names to source strings'
      );
    }
    bytes += Buffer.byteLength(code);
    if (bytes > limits.maxBytes) {
      throw new Error('Project byte limit exceeded');
    }
    try {
      const ast = parser(code, file);
      let program;
      traverse(ast, {
        Program(found) {
          program = found;
          found.stop();
        },
      });
      modules.set(file, { code, ast, program, exports: exportTable(program) });
    } catch (error) {
      diagnostics.push({
        file,
        line: error.loc?.line || 1,
        message: error.message,
      });
    }
  }
  return modules;
}

export function extractProject(sources, options = {}, parser = parseSource) {
  const diagnostics = [];
  const modules = parseModules(
    sources,
    projectLimits(options),
    diagnostics,
    parser
  );
  const resolver = createResolver(modules, options.resolveImport);
  checkImports(modules, diagnostics, options.resolveImport);
  const messages = new Map();
  for (const [file, module] of modules) {
    module.program.setData('lino:imports', resolver(file));
  }
  for (const [file, module] of modules) {
    let result;
    try {
      result = extractMessages(module.code, { file, ast: module.ast });
    } catch (error) {
      diagnostics.push({
        file,
        line: error.loc?.line || 1,
        message: error.message,
      });
      continue;
    }
    diagnostics.push(...result.diagnostics);
    for (const message of result.messages) {
      const previous = messages.get(message.id);
      if (previous && previous.source !== message.source) {
        diagnostics.push({
          file,
          line: message.line,
          message: `Conflicting source messages for id ${message.id}`,
        });
      } else {
        messages.set(message.id, previous || message);
      }
    }
  }
  return {
    version: 1,
    messages: [...messages.values()].sort((a, b) => a.id.localeCompare(b.id)),
    diagnostics,
  };
}

function checkImports(modules, diagnostics, resolveImport) {
  const files = new Set(modules.keys());
  for (const [file, module] of modules) {
    for (const statement of module.ast.program.body) {
      const source = statement.source?.value;
      if (
        !source?.startsWith('.') ||
        statement.importKind === 'type' ||
        statement.exportKind === 'type' ||
        (path.posix.extname(source) &&
          !extensions.includes(path.posix.extname(source)))
      ) {
        continue;
      }
      try {
        if (
          !resolveImport?.(source, file) &&
          !resolveSourceFile(files, file, source)
        ) {
          throw new Error(`Cannot resolve local import ${source}`);
        }
      } catch (error) {
        diagnostics.push({
          file,
          line: statement.loc.start.line,
          message: error.message,
        });
      }
    }
  }
}
