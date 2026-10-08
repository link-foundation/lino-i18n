export { extractMessages } from './extract.js';
import { messageVariables } from './message-schema.js';

export function validateCatalog(
  messages,
  translations,
  { unused = true } = {}
) {
  const issues = [];
  const ids = new Set(messages.map((message) => message.id));
  for (const { id, source } of messages) {
    if (!Object.hasOwn(translations, id)) {
      issues.push({ type: 'missing', id });
      continue;
    }
    try {
      const expected = messageVariables(source);
      const actual = messageVariables(translations[id]);
      if (JSON.stringify(expected) !== JSON.stringify(actual)) {
        issues.push({ type: 'variables', id, expected, actual });
      }
    } catch (error) {
      issues.push({ type: 'syntax', id, message: error.message });
    }
  }
  if (unused) {
    for (const id of Object.keys(translations)) {
      if (!ids.has(id)) {
        issues.push({ type: 'unused', id });
      }
    }
  }
  return issues;
}

export async function translateCatalog(
  messages,
  existing = {},
  { locale, sourceLocale = 'en', provider, signal } = {}
) {
  if (typeof provider !== 'function' || !locale) {
    throw new TypeError(
      'translateCatalog requires a provider and target locale'
    );
  }
  signal?.throwIfAborted();
  const missing = messages.filter(({ id }) => !Object.hasOwn(existing, id));
  const candidates = missing.length
    ? await provider(missing, { locale, sourceLocale, signal })
    : {};
  signal?.throwIfAborted();
  if (
    !candidates ||
    typeof candidates !== 'object' ||
    Object.values(candidates).some((value) => typeof value !== 'string')
  ) {
    throw new TypeError('Translation provider must return a string table');
  }
  const issues = validateCatalog(missing, candidates);
  if (issues.length) {
    throw new Error(
      `Translation provider returned invalid candidates: ${JSON.stringify(issues)}`
    );
  }
  return {
    translations: { ...candidates, ...existing },
    translated: missing.map(({ id }) => id),
  };
}
