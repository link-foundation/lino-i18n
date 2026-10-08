// Opt-in bridge to the public GT SDK. Credentials stay on the caller's SDK.
import { validateCatalog } from '../tooling.js';

function method(sdk, name) {
  if (typeof sdk?.[name] !== 'function') {
    throw new TypeError(`GT SDK requires ${name}`);
  }
}

function sourceTable(messages) {
  const table = Object.create(null);
  for (const { id, source } of messages) {
    if (typeof id !== 'string' || !id || typeof source !== 'string') {
      throw new TypeError('GT messages require string ids and sources');
    }
    if (Object.hasOwn(table, id) && table[id] !== source) {
      throw new Error(`Conflicting source messages for id ${id}`);
    }
    table[id] = source;
  }
  return table;
}

function translatedEntry(entry, id) {
  if (
    !entry?.success ||
    typeof entry.translation !== 'string' ||
    entry.dataFormat !== 'ICU'
  ) {
    throw new Error(
      `GT translation failed for ${id}${entry?.code ? ` (${entry.code})` : ''}`
    );
  }
  return entry.translation;
}

export function createGTProvider(
  sdk,
  { sourceLocale = 'en', batchSize = 100, timeout = 30000, modelProvider } = {}
) {
  method(sdk, 'translateMany');
  if (
    !Number.isInteger(batchSize) ||
    batchSize < 1 ||
    batchSize > 100 ||
    !Number.isFinite(timeout) ||
    timeout <= 0
  ) {
    throw new TypeError(
      'GT provider requires a batch size from 1 to 100 and a positive timeout'
    );
  }
  return async (messages, options) => {
    sourceTable(messages);
    const output = Object.create(null);
    for (let index = 0; index < messages.length; index += batchSize) {
      options.signal?.throwIfAborted();
      const batch = messages.slice(index, index + batchSize);
      // Array input lets the SDK create safe source hashes instead of assigning
      // caller ids (such as __proto__) into its internal ordinary object.
      const entries = batch.map(({ id, source, description }) => ({
        source,
        metadata: {
          id,
          dataFormat: 'ICU',
          ...(description && { context: description }),
        },
      }));
      const result = await sdk.translateMany(
        entries,
        {
          sourceLocale: options.sourceLocale || sourceLocale,
          targetLocale: options.locale,
          ...(modelProvider && { modelProvider }),
        },
        timeout
      );
      options.signal?.throwIfAborted();
      batch.forEach(({ id }, offset) => {
        output[id] = translatedEntry(result?.[offset], id);
      });
    }
    const issues = validateCatalog(messages, output);
    if (issues.length) {
      throw new Error(
        `GT translation validation failed: ${JSON.stringify(issues)}`
      );
    }
    return { ...output };
  };
}

export function createGTCatalogLoader(
  sdk,
  {
    fileId,
    branchId,
    versionId,
    timeout = 30000,
    resolveLocale = (locale) => locale,
  } = {}
) {
  method(sdk, 'downloadFile');
  if (typeof fileId !== 'string' || !fileId) {
    throw new TypeError('GT catalog loader requires a fileId');
  }
  return async (locale, { version } = {}) => {
    const pinned = version && version !== 'default' ? version : versionId;
    const content = await sdk.downloadFile(
      {
        fileId,
        locale: resolveLocale(locale),
        ...(branchId && { branchId }),
        ...(pinned && { versionId: pinned }),
      },
      { timeout }
    );
    const table = JSON.parse(content);
    if (
      !table ||
      typeof table !== 'object' ||
      Array.isArray(table) ||
      Object.values(table).some((value) => typeof value !== 'string')
    ) {
      throw new TypeError(
        'GT catalog download must be a flat JSON string table'
      );
    }
    return { ...table };
  };
}

export function createGTSourceFile(
  messages,
  {
    sourceLocale = 'en',
    fileName = 'messages.json',
    branchId,
    fileId,
    versionId,
  } = {}
) {
  const table = sourceTable(messages);
  const issues = validateCatalog(messages, table);
  if (issues.length) {
    throw new Error(`Invalid GT source catalog: ${JSON.stringify(issues)}`);
  }
  return {
    content: JSON.stringify(table),
    fileName,
    fileFormat: 'JSON',
    dataFormat: 'ICU',
    locale: sourceLocale,
    ...(branchId && { branchId }),
    ...(fileId && { fileId }),
    ...(versionId && { versionId }),
  };
}
