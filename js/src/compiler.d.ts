export declare function createExtractionPlugin(options?: {
  locale?: string;
  catalogFile?: string;
  manifestFile?: string;
}): {
  name: string;
  enforce: 'pre';
  buildStart(): void;
  transform(
    this: { error(message: string): never },
    code: string,
    id: string
  ): null;
  generateBundle(this: {
    error(message: string): never;
    emitFile(asset: {
      type: 'asset';
      fileName: string;
      source: string;
    }): unknown;
  }): void;
};
