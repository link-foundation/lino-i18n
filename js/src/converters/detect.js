// Heuristic format detection for incoming JSON catalogues so the CLI can
// auto-detect when `--from` is omitted.

export const SUPPORTED_FORMATS = ['i18next', 'i18n-js', 'react-intl'];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function flatStringValues(input) {
  if (!isPlainObject(input)) {
    return false;
  }
  return Object.values(input).every((value) => typeof value === 'string');
}

function hasIcuPlaceholders(input) {
  if (!isPlainObject(input)) {
    return false;
  }
  return Object.values(input).some(
    (value) => typeof value === 'string' && /\{\s*\w+\s*[,}]/.test(value)
  );
}

function hasMustachePlaceholders(input) {
  if (!isPlainObject(input)) {
    return false;
  }
  return Object.values(input).some(
    (value) => typeof value === 'string' && /\{\{\s*\w+\s*\}\}/.test(value)
  );
}

function hasPercentPlaceholders(input) {
  if (!isPlainObject(input)) {
    return false;
  }
  return Object.values(input).some(
    (value) => typeof value === 'string' && /%\{\s*\w+\s*\}/.test(value)
  );
}

export function detectFormat(input) {
  if (!isPlainObject(input)) {
    return 'i18next';
  }
  if (
    flatStringValues(input) &&
    (hasIcuPlaceholders(input) || hasMustachePlaceholders(input) === false)
  ) {
    if (hasIcuPlaceholders(input) && !hasMustachePlaceholders(input)) {
      return 'react-intl';
    }
  }
  if (hasPercentPlaceholders(input)) {
    return 'i18n-js';
  }
  return 'i18next';
}
