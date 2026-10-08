import type { ExtractedMessage, TranslationProvider } from '../tooling.js';

export interface GTTranslationSDK {
  translateMany(
    sources: Array<{
      source: string;
      metadata: { id: string; dataFormat: 'ICU'; context?: string };
    }>,
    options: {
      sourceLocale: string;
      targetLocale: string;
      modelProvider?: string;
    },
    timeout?: number
  ): Promise<
    Array<{
      success: boolean;
      translation?: unknown;
      dataFormat?: string;
      code?: number;
    }>
  >;
}
export interface GTCatalogSDK {
  downloadFile(
    query: {
      fileId: string;
      locale: string;
      branchId?: string;
      versionId?: string;
    },
    options?: { timeout?: number }
  ): Promise<string>;
}
export declare function createGTProvider(
  sdk: GTTranslationSDK,
  options?: {
    sourceLocale?: string;
    batchSize?: number;
    timeout?: number;
    modelProvider?: string;
  }
): TranslationProvider;
export declare function createGTCatalogLoader(
  sdk: GTCatalogSDK,
  options: {
    fileId: string;
    branchId?: string;
    versionId?: string;
    timeout?: number;
    resolveLocale?: (locale: string) => string;
  }
): (
  locale: string,
  options?: { version?: string }
) => Promise<Record<string, string>>;
export declare function createGTSourceFile(
  messages: ExtractedMessage[],
  options?: {
    sourceLocale?: string;
    fileName?: string;
    branchId?: string;
    fileId?: string;
    versionId?: string;
  }
): {
  content: string;
  fileName: string;
  fileFormat: 'JSON';
  dataFormat: 'ICU';
  locale: string;
  branchId?: string;
  fileId?: string;
  versionId?: string;
};
