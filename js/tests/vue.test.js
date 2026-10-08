import { test } from 'test-anywhere';
import assert from 'node:assert/strict';
import { createSSRApp, defineComponent, h, Fragment } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { createTranslator } from '../src/messages.js';
import {
  createVueI18n,
  T,
  Var,
  Derive,
  Plural,
  Branch,
  Currency,
  RelativeDate,
  useGT,
  useLocale,
  useTranslations,
} from '../src/vue.js';

async function render(component, i18n) {
  return renderToString(createSSRApp(component).use(createVueI18n({ i18n })));
}

test('Vue SSR restores only code-owned elements and opaque variables', async () => {
  const i18n = createTranslator({
    defaultLocale: 'fr',
    locales: {
      fr: {
        'Hello <c0>{name}</c0>!': 'Bonjour <c0>{name}</c0> !',
      },
    },
  });
  const markup = await render(
    () =>
      h(T, null, {
        default: () => [
          'Hello ',
          h('strong', { title: 'Code-owned' }, [
            h(Var, { name: 'name', value: '<Ada>' }),
          ]),
          '!',
        ],
      }),
    i18n
  );
  assert.match(
    markup,
    /Bonjour <strong title="Code-owned">&lt;Ada&gt;<\/strong> !/
  );
  i18n.addLocale('fr', { 'Hello <c0>{name}</c0>!': '<script>evil</script>' });
  await assert.rejects(
    render(() => h(T, { source: 'Hello <c0>{name}</c0>!' }), i18n)
  );
});

test('Vue fragment, derivation and plural identities match source messages', async () => {
  const app = () =>
    h(T, null, {
      default: () => [
        h(Fragment, null, ['Item ', h(Derive, null, () => 'One')]),
        ' / ',
        h(Plural, { count: 2, name: 'n', one: 'one', other: '# items' }),
        ' / ',
        h(Branch, { value: 'yes', cases: { yes: 'yes', other: 'no' } }),
        ' / ',
        h(Plural, {
          count: 2,
          ordinal: '',
          one: 'first',
          two: 'second',
          other: 'other',
        }),
      ],
    });
  const i18n = createTranslator();
  const markup = await render(app, i18n);
  assert.match(markup, /Item One \/ 2 items \/ yes \/ second/);
  await assert.rejects(
    render(
      () => h(T, { id: 'fixed' }, () => h(Derive, null, () => 'One')),
      i18n
    ),
    /Derived messages/
  );
});

test('Vue request plugins isolate composables, dictionaries and formatting', async () => {
  const App = defineComponent({
    setup() {
      const gt = useGT();
      const locale = useLocale();
      const dictionary = useTranslations('page');
      return () =>
        h('p', { lang: locale.value }, [
          gt('Hi'),
          ' / ',
          dictionary('title'),
          ' / ',
          h(Currency, { value: 0, currency: 'USD', locale: 'en-US' }),
          ' / ',
          h(RelativeDate, {
            value: '2026-01-02',
            now: '2026-01-01',
            locale: 'en',
          }),
        ]);
    },
  });
  const results = await Promise.all(
    ['en', 'fr'].map((defaultLocale) =>
      render(
        App,
        createTranslator({
          defaultLocale,
          locales: { fr: { Hi: 'Salut', 'page.title': 'Titre' } },
        })
      )
    )
  );
  assert.match(results[0], /lang="en".*Hi/);
  assert.match(results[1], /lang="fr".*Salut \/ Titre \/ \$0\.00 \/ in 1 day/);
});

test('Vue initialization preloads async catalogs and retries failed loads', async () => {
  assert.equal(await createVueI18n().initialize(), 'en');
  let attempts = 0;
  const plugin = createVueI18n({
    defaultLocale: 'fr',
    loadCatalog: async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error('offline');
      }
      return { Hi: 'Salut' };
    },
  });
  await assert.rejects(plugin.initialize(), /offline/);
  await Promise.all([plugin.initialize(), plugin.initialize()]);
  assert.equal(attempts, 2);
  assert.equal(plugin.gt('Hi'), 'Salut');
  await assert.rejects(
    renderToString(createSSRApp(() => h(T, { source: 'Hi' }))),
    /Vue plugin/
  );
});
