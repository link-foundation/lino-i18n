// Run manually with GT credentials, a source manifest and a target locale.
// Publishing is an explicit --publish option; downloaded catalogs stay local.
import { readFile, writeFile } from 'node:fs/promises';
import { GT } from 'generaltranslation';
import {
  createGTSourceFile,
  createGTCatalogLoader,
} from '../src/providers/gt.js';
import { validateCatalog } from '../src/tooling.js';
import { formatLinoCatalog } from '../src/catalogs.js';

const [manifestFile, locale, outputFile, ...flags] = process.argv.slice(2);
if (
  !manifestFile ||
  !locale ||
  !outputFile ||
  !process.env.GT_PROJECT_ID ||
  !process.env.GT_API_KEY
) {
  throw new Error(
    'Usage: GT_PROJECT_ID=... GT_API_KEY=... node examples/gt-project-workflow.mjs messages.json fr fr.lino [--publish]'
  );
}
const { messages } = JSON.parse(await readFile(manifestFile, 'utf8'));
const sourceLocale = process.env.GT_SOURCE_LOCALE || 'en';
const sdk = new GT({
  projectId: process.env.GT_PROJECT_ID,
  apiKey: process.env.GT_API_KEY,
  sourceLocale,
});
const { uploadedFiles } = await sdk.uploadSourceFiles(
  [
    {
      source: createGTSourceFile(messages, {
        sourceLocale,
        branchId: process.env.GT_BRANCH_ID,
      }),
    },
  ],
  { sourceLocale }
);
const queued = await sdk.enqueueFiles(uploadedFiles, {
  sourceLocale,
  targetLocales: [locale],
});
const result = await sdk.awaitJobs(queued, {
  timeoutSeconds: 120,
  pollingIntervalSeconds: 2,
});
if (
  !result.complete ||
  result.jobs.some(({ status }) => status !== 'completed')
) {
  throw new Error(
    'GT jobs did not complete successfully; inspect the project job status'
  );
}
const table = await createGTCatalogLoader(sdk, uploadedFiles[0])(locale);
const issues = validateCatalog(messages, table);
if (issues.length) {
  throw new Error(
    `Downloaded catalog requires review: ${JSON.stringify(issues)}`
  );
}
await writeFile(outputFile, `${formatLinoCatalog(locale, table)}\n`);
if (flags.includes('--publish')) {
  await sdk.publishFiles(
    uploadedFiles.map((file) => ({ ...file, locale, publish: true }))
  );
}
console.log(`Validated catalog written to ${outputFile}`);
