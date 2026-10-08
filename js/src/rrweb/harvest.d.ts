import type { eventWithTime } from '@rrweb/types';
import type { LocaleTextOverlay } from 'gt-rrweb/harvest';
import type { ReplayCatalogOptions, ReplayCatalogLoader } from './catalog.js';
export { toReplayCatalog, createReplayLoader } from './catalog.js';
export type {
  ReplayCatalog,
  ReplayCatalogOptions,
  ReplayCatalogLoader,
} from './catalog.js';
export interface ReplayHarvestOptions extends ReplayCatalogOptions {
  loadCatalog?: ReplayCatalogLoader;
  onError?: (error: unknown, locale: string) => void;
  /** Default 30000; maximum 100000. */
  maxEvents?: number;
  /** Counts objects/arrays throughout events. Default 100000; maximum 200000. */
  maxNodes?: number;
  /** Counts all event string values in UTF-8. Default 10 MiB; maximum 50 MiB. */
  maxTextBytes?: number;
}
export declare function harvestReplay(
  events: eventWithTime[],
  locales: readonly string[],
  options?: ReplayHarvestOptions
): Promise<LocaleTextOverlay>;
