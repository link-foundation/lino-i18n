import {
  createStart,
  createIsomorphicFn,
  createCsrfMiddleware,
} from '@tanstack/react-start';
import { getTranslation } from './i18n.js';
export const startInstance = createStart(
  createIsomorphicFn()
    .server(() => ({
      requestMiddleware: [
        createCsrfMiddleware({
          filter: (ctx) => ctx.handlerType === 'serverFn',
        }),
        getTranslation().middleware,
      ],
    }))
    .client(() => ({}))
);
