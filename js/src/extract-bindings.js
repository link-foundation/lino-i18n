// A project's resolver returns AST paths, never evaluated application exports.
export function importResolver(path) {
  return path.scope.getProgramParent().path.getData('lino:imports');
}

export function referencePath(path, node, seen = new Set()) {
  if (node?.type === 'MemberExpression') {
    const object = referencePath(path, node.object, seen);
    const property = node.computed ? node.property.value : node.property.name;
    return object?.resolve?.(property, seen);
  }
  if (node?.type !== 'Identifier') {
    return undefined;
  }
  const binding = path.scope.getBinding(node.name);
  if (!binding?.constant || seen.has(binding)) {
    return undefined;
  }
  seen.add(binding);
  if (/^Import/.test(binding.path.type)) {
    return importedPath(binding.path, seen);
  }
  return binding.path;
}

function importedPath(path, seen) {
  const imported = importResolver(path)?.(path, seen);
  return imported?.node && /^Import/.test(imported.type)
    ? referencePath(imported, imported.node.local, seen)
    : imported;
}

export function staticDeclaration(path, node) {
  const declared = referencePath(path, node);
  if (!declared?.node) {
    throw new Error(
      'Cannot resolve a static declaration; check imports or cycles'
    );
  }
  return declared.isVariableDeclarator() ? declared.get('init') : declared;
}
