#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
import { getChangedFiles } from './pr-comparison.mjs';

try {
  const files = getChangedFiles();
  console.log('Changed files:', files);
  const flags = {
    'mjs-changed': files.some((file) => /^js\/.*\.mjs$/.test(file)),
    'js-changed': files.some((file) => /^js\/.*\.(?:[cm]?js|tsx?)$/.test(file)),
    'package-changed': files.some((file) =>
      /^js\/package(?:-lock)?\.json$/.test(file)
    ),
    'docs-changed': files.some((file) => /^(?:docs\/|js\/).*\.md$/.test(file)),
    'workflow-changed': files.some(
      (file) =>
        /^(?:\.github\/|\.githooks\/|scripts\/|experiments\/issue-23-)/.test(
          file
        ) ||
        (/^js\/[^/]+$/.test(file) && !file.endsWith('.md')) ||
        file === 'js/.changeset/config.json'
    ),
    'any-code-changed': files.some((file) =>
      /^(?:js\/(?:src|bin)\/.*|js\/package(?:-lock)?\.json)$/.test(file)
    ),
  };
  for (const [key, value] of Object.entries(flags)) {
    const output = `${key}=${value}`;
    console.log(output);
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
    }
  }
} catch (error) {
  console.error(`::error::Change detection failed: ${error.message}`);
  process.exitCode = 1;
}
