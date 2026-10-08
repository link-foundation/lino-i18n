import type { SanityClient, SanityDocument, Schema } from 'sanity';
import type {
  BaseDocumentSerializer,
  BaseDocumentDeserializer,
} from 'gt-sanity';
export * from 'gt-sanity';

export interface SanityCatalogOptions {
  /** Arrays are limited to 1,000 items to bound the upstream keyed merger. */
  sourceLocale: string;
  /** Document localization is the default; field is the legacy locale-object model. */
  mode?: 'document' | 'field';
  additionalStopTypes?: string[];
  serializers?: Parameters<
    ReturnType<typeof BaseDocumentSerializer>['serializeDocument']
  >[4];
  /** Default 1 MiB; maximum 10 MiB. Applies to input/output documents, HTML and catalogs. */
  maxBytes?: number;
  /** Default 10,000; maximum 100,000 JSON/HTML nodes. */
  maxNodes?: number;
  /** Default 100; maximum 200 JSON/HTML levels. */
  maxDepth?: number;
}
export interface SanityImportOptions extends SanityCatalogOptions {
  locale: string;
  deserializers?: Parameters<
    typeof BaseDocumentDeserializer.deserializeDocument
  >[1];
  blockDeserializers?: Parameters<
    typeof BaseDocumentDeserializer.deserializeDocument
  >[2];
}
export interface SanityImportPlan {
  documentId: string;
  revision: string;
  /** Changes only; metadata is preserved. Field mode uses Sanity patch paths. */
  set: Record<string, unknown>;
}
export declare function sanityDocumentKey(
  document: Pick<SanityDocument, '_id' | '_rev' | '_type'>
): string;
export declare function exportSanityDocument(
  document: SanityDocument,
  schema: Schema,
  options: SanityCatalogOptions
): string;
export declare function prepareSanityImport(
  source: SanityDocument,
  target: SanityDocument,
  schema: Schema,
  catalog: string,
  options: SanityImportOptions
): SanityImportPlan;
/** Explicit mutation of an existing document; guarded by the plan's target revision. */
export declare function commitSanityImport(
  client: SanityClient,
  plan: SanityImportPlan
): Promise<SanityDocument>;
