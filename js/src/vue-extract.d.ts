export declare function extractVueMessages(
  source: string,
  options?: { file?: string; maxBytes?: number }
): ReturnType<typeof import('./tooling.js').extractMessages>;

export declare function extractVueProject(
  ...args: Parameters<typeof import('./tooling.js').extractProject>
): ReturnType<typeof import('./tooling.js').extractProject>;
