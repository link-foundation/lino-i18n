import { createSSRApp, defineComponent, h } from 'vue';
import {
  createVueI18n,
  useLocale,
  useGT,
  T,
  Var,
  Currency,
  RelativeDate,
} from 'lino-i18n/vue';
const plugin = createVueI18n({ defaultLocale: 'en' });
plugin.gt('Hi {name}', { name: 'Ada' });
createSSRApp(
  defineComponent({
    setup() {
      const locale = useLocale();
      const gt = useGT();
      const text: string = locale.value;
      return () =>
        h(T, { source: gt(text) }, () =>
          h(Var, { name: 'name', value: 'Ada' })
        );
    },
  })
).use(plugin);
h(Currency, { currency: 'USD', value: 0 });
h(RelativeDate, { value: '2026-01-02', now: '2026-01-01' });
// @ts-expect-error currency is required
h(Currency, { value: 1 });
// @ts-expect-error relative dates require an explicit clock
h(RelativeDate, { value: '2026-01-02' });
// @ts-expect-error locale computed refs are readonly
useLocale().value = 'fr';

import { extractVueMessages, extractVueProject } from 'lino-i18n/vue/extract';
extractVueMessages('<template>Hi</template>').messages;
extractVueProject({ 'App.vue': '<template>Hi</template>' }, { maxFiles: 10 })
  .diagnostics;
