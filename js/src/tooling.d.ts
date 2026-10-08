export interface ExtractedMessage {
  id: string;
  source: string;
  description?: string;
  variables?: string[];
  file?: string;
  line?: number;
  column?: number;
}
export interface ExtractionManifest {
  version: 1;
  messages: ExtractedMessage[];
  diagnostics: Array<{ file: string; line: number; message: string }>;
}
export interface CatalogIssue {
  type: 'missing' | 'unused' | 'syntax' | 'variables';
  id: string;
  expected?: string[];
  actual?: string[];
  message?: string;
}
export type TranslationProvider = (
  messages: ExtractedMessage[],
  options: { locale: string; sourceLocale: string; signal?: AbortSignal }
) => Promise<Record<string, string>>;
export declare function extractMessages(
  code: string,
  options?: { file?: string }
): ExtractionManifest;
export declare function validateCatalog(
  messages: ExtractedMessage[],
  translations: Record<string, string>,
  options?: { unused?: boolean }
): CatalogIssue[];
export declare function translateCatalog(
  messages: ExtractedMessage[],
  existing: Record<string, string>,
  options: {
    locale: string;
    sourceLocale?: string;
    provider: TranslationProvider;
    signal?: AbortSignal;
  }
): Promise<{ translations: Record<string, string>; translated: string[] }>;
