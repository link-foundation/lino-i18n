import type { ReactElement } from 'react';
import type { GTRecorderProps } from 'gt-rrweb';
import type { ContentProps } from '../react.js';
import type { ReplayHarvestOptions } from './harvest.js';
export * from '../react.js';
export {
  GTRecorder,
  RecordingOverlay,
  useRecorder,
  GT_EVENT,
  DEFAULT_CONTENT_SELECTOR,
} from 'gt-rrweb';
export type {
  GTRecorderProps,
  RecorderBundle,
  RecorderConfig,
  RecorderStatus,
  FrameOption,
  LocaleTextOverlay,
  UseRecorder,
} from 'gt-rrweb';
export { harvestReplay } from './harvest.js';
export type { ReplayHarvestOptions } from './harvest.js';
export { toReplayCatalog, createReplayLoader } from './catalog.js';
export type {
  ReplayCatalog,
  ReplayCatalogOptions,
  ReplayCatalogLoader,
} from './catalog.js';
export declare function T(props: ContentProps): ReactElement;
export interface RecorderProps extends Omit<GTRecorderProps, 'harvest'> {
  catalogs?: ReplayHarvestOptions;
  onError?: (error: unknown) => void;
}
/** onComplete receives the harvested bundle; useRecorder().stop() returns raw capture. */
export declare function Recorder(props: RecorderProps): ReactElement;
