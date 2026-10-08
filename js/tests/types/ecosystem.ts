import {
  extractPythonMessages,
  extractPythonProject,
} from 'lino-i18n/python/extract';
import {
  getGTSupportedLocale,
  listGTSupportedLocales,
} from 'lino-i18n/providers/gt-locales';
import { unified } from 'unified';
import escapeHtml, {
  preserveEscapedEntities,
  remarkGfmCustom,
} from 'lino-i18n/remark';
const one = await extractPythonMessages('from gt_flask import t\nt("Hello")', {
  file: 'app.py',
});
const project = await extractPythonProject({ 'app.py': '' }, { maxFiles: 5 });
const locale: string | null = getGTSupportedLocale('zh-Hant-TW');
const locales: string[] = listGTSupportedLocales();
unified().use(escapeHtml).use(remarkGfmCustom).use(preserveEscapedEntities);
console.log(one.messages, project.diagnostics, locale, locales);
// @ts-expect-error source code is text
extractPythonMessages(42);
// @ts-expect-error registry locale is text
getGTSupportedLocale(42);
