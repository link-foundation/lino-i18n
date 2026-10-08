import plugin, { type LinoLintOptions } from 'lino-i18n/eslint';
import type { ESLint, Linter } from 'eslint';

const actualPlugin: ESLint.Plugin = plugin;
const config: Linter.Config = plugin.configs.recommended;
const options: LinoLintOptions = {
  maxBytes: 1000,
  maxNodes: 100,
  maxDepth: 50,
};
// @ts-expect-error Budgets must be numbers.
const invalid: LinoLintOptions = { maxBytes: 'unlimited' };
void [actualPlugin, config, options, invalid];
