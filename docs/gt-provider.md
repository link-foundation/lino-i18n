# General Translation service bridge

`lino-i18n/providers/gt` accepts the public `generaltranslation` SDK (tested at
9.5.5). The SDK is optional. Core, browser, React and compiler entries do not
import it, and translator snapshots contain no SDK credentials.

## Translation candidates

```js
import { GT } from "generaltranslation";
import { createGTProvider } from "lino-i18n/providers/gt";
import { translateCatalog } from "lino-i18n/tooling";

const sdk = new GT({ projectId, apiKey, sourceLocale: "en" });
const provider = createGTProvider(sdk, { batchSize: 100, timeout: 30000 });
const candidate = await translateCatalog(messages, approvedFrench, {
  locale: "fr",
  sourceLocale: "en",
  provider,
});
```

The provider sends ICU sources, ids and description context through
`translateMany`, in sequential batches of at most 100. It validates returned ICU
syntax, variables and rich tags, rejects missing/failed entries and preserves
approved translations through the existing candidate workflow. It does not
retry chargeable requests automatically. Cancellation is checked between
batches and after each response; in-flight SDK requests use the explicit
timeout. Configure models and credentials on the SDK/provider at the server or
build boundary.

## Project files and versioned loading

```js
import { createTranslator } from "lino-i18n/messages";
import {
  createGTSourceFile,
  createGTCatalogLoader,
} from "lino-i18n/providers/gt";

const { uploadedFiles } = await sdk.uploadSourceFiles(
  [{ source: createGTSourceFile(messages, { sourceLocale: "en" }) }],
  { sourceLocale: "en" },
);
const i18n = createTranslator({
  version: uploadedFiles[0].versionId,
  loadCatalog: createGTCatalogLoader(sdk, uploadedFiles[0]),
});
await i18n.switchLocale("fr");
```

The bridge uses GT's supported flat JSON/ICU file format for service exchange;
local approved catalogs remain `.lino`. `createGTSourceFile` rejects conflicting
ids and invalid source ICU. `createGTCatalogLoader` carries file/branch/version
ids to `downloadFile` and rejects non-string JSON tables. A translator's version
overrides the file's version; the default sentinel leaves the configured file
version in effect. For custom catalog identities, supply `resolveLocale` using
the translator's `LocaleConfig` to canonicalize at the service boundary.

Project branches, tags, job enqueue/polling, publishing, assets and file moves
remain operations on the same SDK instance, using its documented public
methods. [The runnable workflow](../js/examples/gt-project-workflow.mjs) uploads
source JSON, queues translation, waits finitely, validates the result and writes
a local `.lino` catalog. CDN publishing requires its explicit `--publish` flag.

## Verification boundaries

The automated contract experiment uses the actual published SDK against a local
HTTP service, covering runtime translation metadata, SDK base64 file uploads and
version-pinned downloads. Unit tests cover batching, provider errors, malformed
downloads and variable validation. Types compile against the actual SDK.

No GT project id or API key is configured in the issue-solver environment.
Credentialed staging, job execution, quality, billing and hosted publication
were therefore not exercised. The runnable workflow is a recipe for those
operations, not evidence that a remote service deployment passed. The capability
matrix retains that limitation and the remaining framework/agent integrations.

Primary evidence is the [pinned GT runtime](https://github.com/generaltranslation/gt/blob/fb7584f5548b7454a7c95827de459c684f659d5b/packages/core/src/runtime.ts),
[runtime request implementation](https://github.com/generaltranslation/gt/blob/fb7584f5548b7454a7c95827de459c684f659d5b/packages/core/src/translate/runtimeTranslate.ts)
and [file upload types](https://github.com/generaltranslation/gt/blob/fb7584f5548b7454a7c95827de459c684f659d5b/packages/core/src/types-dir/api/uploadFiles.ts),
saved with checksums in the case study. The SDK forwards project services to the
public API; lino-i18n does not implement a replacement translation backend.
