# Sanity document catalogs

The optional `lino-i18n/sanity` export preserves the published `gt-sanity` 4.0.24
API and adds `.lino` transport for revision-bound document and legacy field
translations. Sanity and GT remain optional peers; the core entry does not load
Studio, its CLI or React.

Install `gt-sanity`, Sanity 6.18 or newer within major 6, and the peers required
by those packages in your Studio project. The actual fixture uses React 19.3,
Sanity/schema/mutator 6.18.0, UI 4.4.0 and icons 5.2.3. Sanity requires Node
22.12 or newer. Version 6.9.2 from GT's pinned research is deprecated for a
[Portable Text data-loss defect](https://www.sanity.io/docs/changelog/studio-Ni4xNC4w);
the fixture uses the fixed current release.

## Existing GT Studio features

Import `gtPlugin`, `gtStructure`, `TranslationsTab`, document internationalization,
internationalized arrays and the serializer/merger exports from
`lino-i18n/sanity`. They are the actual published GT exports, preserving schema
configuration, locale menus, document actions, field arrays, singletons,
custom serializers and GT's hosted workflow. Configure these through the
upstream `GTPluginConfig` in your existing Studio.

GT's current `TranslationsTab` uses its own provider and hosted project state;
its exported legacy `Adapter` type does not make the tab accept arbitrary
catalog storage. The `.lino` helpers below form a separate explicit transport.
They do not replace that provider, add a Studio tool or automatically publish
documents. Real schema, serialization and client contracts are tested locally;
an authenticated Studio and hosted project workflow were not exercised.

## Export and prepare an import

These helpers run in Studio's DOM environment. A server-side tool needs a DOM
implementation providing `document`, `DOMParser`, `Element`, `HTMLElement` and
`Node`; install and restore those globals before using the upstream serializers.
The fixture uses JSDOM without executing document scripts.

```js
import {
  exportSanityDocument,
  prepareSanityImport,
  commitSanityImport,
} from "lino-i18n/sanity";

const sourceCatalog = exportSanityDocument(sourceDocument, schema, {
  sourceLocale: "en",
});
// Save the source catalog. A translator edits its HTML text in a fr locale root.
const plan = prepareSanityImport(
  sourceDocument,
  existingFrenchDocument,
  schema,
  approvedFrenchCatalog,
  { sourceLocale: "en", locale: "fr" },
);
// Review plan.set, then explicitly commit through your configured Sanity client.
await commitSanityImport(client, plan);
```

`sanityDocumentKey(document)` encodes the source `_id` and `_rev`. Imports must
contain exactly one target locale root and a value for that exact revision. A
changed source revision rejects the old catalog. Document mode requires a
distinct existing target with the same schema type; its `_id`, `_rev`, timestamps
and untouched fields stay intact. Prepare a target using your Studio's normal
document-internationalization workflow, retaining source array keys. Imports
reject a target missing translated array keys; GT's merger otherwise silently
skips those blocks.

The exported value is GT's serialized HTML, stored as an escaped `.lino` string.
Only HTML text nodes can change. Element order, attributes, metadata, annotation
data and ids must remain identical. This prevents an edited catalog from
redirecting a title into an excluded field or adding executable markup. It also
means a translator must preserve text-node structure and rich markup; arbitrary
HTML rewriting, new blocks and empty-node removal are rejected.

Schema exclusions (`localize: false`, `options.gt.exclude`, document
internationalization and assist exclusions) use GT's serializer, including
excluded localized objects in field mode. Define exclusions for shared metadata such as
your language field. Custom serializers/deserializers remain application code
and must agree on a stable structure.

GT's deserializer generates new span keys. The bridge restores source Portable
Text span keys only when child types, count and marks match, rejecting an
ambiguous round trip. Block/annotation data uses the upstream serializers.
`prepareSanityImport` returns `{ documentId, revision, set }`, without mutation.
`commitSanityImport` patches the existing target using `ifRevisionId(revision)`;
a concurrent edit fails through the Sanity client. It neither creates a target
nor publishes a draft.

## Legacy field localization

Pass `mode: 'field'` to export and import a locale-object document such as
`title: { en: 'Hello', fr: 'Salut' }`. Source and target must be the same current
document revision. The plan contains paths such as `title.fr`; locale hyphens
use GT's underscore field convention. Source and target locales must differ.
Internationalized-array models remain supported by the re-exported Studio
plugin; this catalog transport supports document and legacy field modes.

JSON and HTML processing defaults to 1 MiB, 10,000 nodes and depth 100. Options
`maxBytes`, `maxNodes` and `maxDepth` have hard maxima 10 MiB, 100,000 and 200.
Arrays are limited to 1,000 items because GT's keyed merger searches them
quadratically. Cycles, repeated object references, accessors, non-JSON values and reserved
prototype keys reject before serialization. Inputs are copied so upstream
serialization cannot mutate caller-owned documents.

## Reproducing the framework contract

From `js/`, run:

```sh
npm ci --prefix examples/sanity-usage --install-links
npm --prefix examples/sanity-usage test
npm --prefix examples/sanity-usage run test:types
```

The isolated consumer installs the current local package as a copy and exercises
actual Sanity schema compilation, GT serializer/deserializer/merger exports,
Portable Text keys/marks, excluded fields, malformed/stale catalogs and an
actual Sanity client's revision-guarded mutation against a loopback HTTP server.
Strict consumer type tests check positive and negative APIs; third-party Studio
declarations use `skipLibCheck` because the actual strict run found missing GROQ
declarations, incompatible QuickLRU iterator types and missing Studio type
imports. The [saved diagnostics](case-studies/issue-25/data/sanity-type-errors.txt)
record those errors. The main package's five type suites continue to use strict
library checks.

The optional Studio/CLI dependency graph reported 19 advisories on 2026-10-08,
including unpatched glob-pattern dependencies and old YAML/UUID dependencies.
The [saved report](case-studies/issue-25/data/sanity-advisories.json) preserves
the advisory links. Isolating the consumer fixture keeps those CLI dependencies
out of the core install, whose audit is clean; it does not resolve the upstream
advisories. Assess and update the upstream Studio toolchain before using its CLI
on untrusted inputs. No live CMS credentials or publication were used in tests.
