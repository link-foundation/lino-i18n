// Keep request state and Node imports in the optional server entry.
import { createMiddleware } from '@tanstack/react-start';
import { createTranslationContext } from '../node.js';
import { createRequestTranslator } from '../server.js';

export {
  getRequestLocale,
  localizePath,
  stripLocale,
  createLocaleMiddleware,
} from '../server.js';

export function createTanStackI18n(options = {}) {
  const context = createTranslationContext();
  const configured = { sourceLocale: 'en', ...options };
  const middleware = createMiddleware().server(({ request, next }) =>
    context.withRequest(request, configured, () =>
      next({ context: { lino: context.getTranslator() } })
    )
  );
  return {
    ...context,
    middleware,
    getSnapshot: () => context.getTranslator().snapshot(),
    getEnabled: () => context.getTranslator().getEnabled(),
    async loadSnapshot(locale) {
      const active = context.getTranslator();
      if (!active.getLocaleConfig().locales.includes(locale)) {
        throw new RangeError(`Unsupported locale ${locale}`);
      }
      if (active.getLocale() === locale) {
        return active.snapshot();
      }
      const i18n = await createRequestTranslator(
        new Request('https://lino.invalid/'),
        { ...configured, locale }
      );
      return i18n.snapshot();
    },
  };
}
