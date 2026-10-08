export interface JSXTransformOptions {
  file?: string;
  autoText?: boolean;
  attributes?: string[];
  components?: Record<string, string[]>;
  attributeTranslator?: string;
  serverTranslator?: string;
}
export interface TransformedSource {
  code: string;
  map: {
    version: number;
    sources: string[];
    sourcesContent?: Array<string | null>;
    names: string[];
    mappings: string;
  } | null;
}
export declare function transformJSX(
  code: string,
  options?: JSXTransformOptions
): TransformedSource;
export declare function createExtractionPlugin(options?: {
  locale?: string;
  catalogFile?: string;
  manifestFile?: string;
  transform?: JSXTransformOptions;
}): {
  name: string;
  enforce: 'pre';
  buildStart(): void;
  transform(
    this: { error(message: string): never },
    code: string,
    id: string
  ): TransformedSource | null;
  generateBundle(this: {
    error(message: string): never;
    emitFile(asset: {
      type: 'asset';
      fileName: string;
      source: string;
    }): unknown;
    resolve?(
      source: string,
      importer: string,
      options: { skipSelf: true }
    ): Promise<{
      id: string;
      external?: boolean | 'absolute' | 'relative';
    } | null>;
  }): Promise<void>;
};
