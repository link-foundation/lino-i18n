import { defineComponent, h, ref } from 'vue';
import {
  T,
  Var,
  LocaleSelector,
  useGT,
  useLocale,
  Currency,
} from '../../src/vue.js';

export const locales = {
  en: {},
  fr: {
    'Vue source translation': 'Traduction des textes avec Vue',
    'Hello <c0>{name}</c0>!': 'Bonjour <c0>{name}</c0> !',
    'Items: {count}': 'Articles : {count}',
    'Click <c0>Add an item</c0>': 'Cliquez sur <c0>Ajouter un article</c0>',
    Ready: 'Prêt',
  },
};

export const App = defineComponent({
  setup() {
    const gt = useGT();
    const locale = useLocale();
    const count = ref(2);
    const error = ref('');
    return () =>
      h('main', { lang: locale.value }, [
        h('header', null, [
          h('span', { class: 'label' }, 'LINO / VUE'),
          h(LocaleSelector, {
            locales: ['en', 'fr', 'de'],
            labels: { en: 'English', fr: 'Français', de: 'Unavailable' },
            onError: () => {
              error.value = 'Catalog unavailable';
            },
          }),
        ]),
        h('h1', null, h(T, { source: 'Vue source translation' })),
        h(
          'p',
          { class: 'greeting' },
          h(T, null, () => [
            'Hello ',
            h(
              'strong',
              { title: 'Code-owned name' },
              h(Var, { name: 'name', value: 'Ada' })
            ),
            '!',
          ])
        ),
        h('section', null, [
          h(
            'p',
            { class: 'count' },
            h(T, null, () => [
              'Items: ',
              h(Var, { name: 'count', value: count.value }),
            ])
          ),
          h(T, null, () => [
            'Click ',
            h(
              'button',
              {
                onClick: () => {
                  count.value++;
                },
              },
              'Add an item'
            ),
          ]),
        ]),
        h('p', null, h(Currency, { currency: 'USD', value: 2 })),
        h('p', { class: 'status', role: 'status' }, error.value || gt('Ready')),
      ]);
  },
});
