import type { ExtractionManifest } from './tooling.js';
export interface PythonExtractionOptions {
  file?: string;
  python?: string;
  maxBytes?: number;
  maxVariants?: number;
  timeout?: number;
}
export declare function extractPythonMessages(
  source: string,
  options?: PythonExtractionOptions
): Promise<ExtractionManifest>;
export declare function extractPythonProject(
  sources: Record<string, string>,
  options?: PythonExtractionOptions & { maxFiles?: number }
): Promise<ExtractionManifest>;
