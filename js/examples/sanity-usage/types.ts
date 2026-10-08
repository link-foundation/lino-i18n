import {
  exportSanityDocument,
  prepareSanityImport,
  commitSanityImport,
  gtPlugin,
  type SanityImportPlan,
} from 'lino-i18n/sanity';
import type { SanityClient, SanityDocument, Schema } from 'sanity';

declare const source: SanityDocument;
declare const target: SanityDocument;
declare const schema: Schema;
declare const client: SanityClient;
const catalog: string = exportSanityDocument(source, schema, {
  sourceLocale: 'en',
  maxDepth: 50,
});
const plan: SanityImportPlan = prepareSanityImport(
  source,
  target,
  schema,
  catalog,
  { locale: 'fr', sourceLocale: 'en' }
);
const result: Promise<SanityDocument> = commitSanityImport(client, plan);
gtPlugin({
  sourceLocale: 'en',
  locales: ['fr'],
  translationLevel: 'mixed',
  autoPublish: false,
});
// @ts-expect-error Source locale must be explicit.
exportSanityDocument(source, schema, {});
exportSanityDocument(source, schema, {
  sourceLocale: 'en',
  // @ts-expect-error Internationalized arrays use the upstream Studio plugin, not this catalog mode.
  mode: 'internationalizedArray',
});
// @ts-expect-error Imports require a target locale.
prepareSanityImport(source, target, schema, catalog, { sourceLocale: 'en' });
void result;
