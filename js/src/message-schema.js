import { parse } from '@formatjs/icu-messageformat-parser';

export function escapeMessageText(text) {
  return String(text)
    .replaceAll("'", "''")
    .replace(/[{}<]/g, (character) => `'${character}'`);
}

export function messageVariables(source) {
  const variables = new Set();
  function visit(nodes) {
    for (const node of nodes) {
      if ([1, 2, 3, 4, 5, 6, 8].includes(node.type)) {
        variables.add(node.value);
      }
      if (node.children) {
        visit(node.children);
      }
      for (const option of Object.values(node.options || {})) {
        visit(option.value);
      }
    }
  }
  visit(parse(source));
  return [...variables].sort();
}
