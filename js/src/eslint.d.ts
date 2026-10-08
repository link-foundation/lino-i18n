import type { ESLint, Linter } from 'eslint';

export interface LinoLintOptions {
  /** UTF-8 source bytes. Default 1 MiB, maximum 10 MiB. */
  maxBytes?: number;
  /** Default 100,000, maximum 200,000 AST nodes. */
  maxNodes?: number;
  /** Default 100, maximum 200 AST levels. */
  maxDepth?: number;
}

declare const plugin: ESLint.Plugin & {
  configs: { recommended: Linter.Config };
};
export default plugin;
