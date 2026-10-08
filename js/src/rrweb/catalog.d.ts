import type { TranslationDict, TranslationsLoader } from 'gt-rrweb/harvest';

export type ReplayCatalog = string | Record<string, string>;
export interface ReplayCatalogOptions {
  locale?: string;
  sources?: ReplayCatalog;
  sourceLocale?: string;
  /** UTF-8 budget. Default 10 MiB; maximum 50 MiB. */
  maxCatalogBytes?: number;
  /** Per-message UTF-8 budget before parsing. Default 64 KiB; maximum 256 KiB. */
  maxMessageBytes?: number;
  /** Default 10000; maximum 100000. */
  maxEntries?: number;
  /** Per-message AST budget. Default 10000; maximum 50000. */
  maxAstNodes?: number;
  /** Default 100; maximum 200. */
  maxDepth?: number;
}
export type ReplayCatalogLoader = (
  locale: string
) => ReplayCatalog | Promise<ReplayCatalog>;
export declare function toReplayCatalog(
  catalog: ReplayCatalog,
  options?: ReplayCatalogOptions
): TranslationDict;
export declare function createReplayLoader(
  loadCatalog: ReplayCatalogLoader,
  options?: ReplayCatalogOptions
): TranslationsLoader;
