import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Text, View, Pressable, StyleSheet } from 'react-native-web';
import { createNativeI18n, Var, useGT } from '../../src/react-native.js';

const locales = {
  fr: {
    'Native source translation': 'Traduction des textes natifs',
    'Hello <c0>{name}</c0>!': 'Bonjour <c0>{name}</c0> !',
    'Items: {count}': 'Articles : {count}',
    'Add an item': 'Ajouter un article',
    'Stored language: {locale}': 'Langue enregistrée : {locale}',
  },
};
const native = createNativeI18n({
  Text,
  locales,
  loadCatalog: (locale) =>
    locales[locale]
      ? Promise.resolve(locales[locale])
      : Promise.reject(new Error('Catalog unavailable')),
  storage: {
    getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
    setItem: (key, value) =>
      Promise.resolve(window.localStorage.setItem(key, value)),
  },
});
const styles = StyleSheet.create({
  screen: {
    maxWidth: 710,
    width: '100%',
    padding: 36,
    gap: 26,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  label: { color: '#526679', fontSize: 12, letterSpacing: 2 },
  heading: { color: '#142333', fontSize: 34, fontWeight: 'bold' },
  text: { color: '#142333', fontSize: 21 },
  name: { color: '#214ed3', fontWeight: 'bold' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  button: { backgroundColor: '#214ed3', padding: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16 },
  status: { color: '#526679', fontSize: 14 },
});

function App() {
  const gt = useGT();
  const selector = native.useLocaleSelector(['en', 'fr', 'de']);
  const [count, setCount] = useState(2);
  const [status, setStatus] = useState('');
  const add = () => setCount((value) => value + 1);
  const choose = async (locale) => {
    try {
      await selector.setLocale(locale);
      setStatus('');
    } catch (error) {
      setStatus(error.message);
    }
  };
  return h(
    View,
    { style: styles.screen },
    h(Text, { style: styles.label }, 'LINO · REACT NATIVE'),
    h(
      native.T,
      {
        textProps: {
          style: styles.heading,
          accessibilityRole: 'header',
          testID: 'title',
        },
      },
      'Native source translation'
    ),
    h(
      View,
      { style: styles.row },
      ...[
        ['en', 'English'],
        ['fr', 'Français'],
        ['de', 'Deutsch'],
      ].map(([locale, label]) =>
        h(
          Pressable,
          {
            key: locale,
            accessibilityRole: 'button',
            accessibilityLabel: label,
            onPress: () => choose(locale),
            style: styles.button,
          },
          h(Text, { style: styles.buttonText }, label)
        )
      )
    ),
    h(
      native.T,
      { textProps: { style: styles.text, testID: 'greeting' } },
      'Hello ',
      h(
        Text,
        { style: styles.name, testID: 'name', onPress: add },
        h(Var, { name: 'name', value: 'Ada' })
      ),
      '!'
    ),
    h(
      native.T,
      { textProps: { style: styles.text, testID: 'count' } },
      'Items: ',
      h(Var, { name: 'count', value: count })
    ),
    h(native.Currency, {
      value: 0,
      currency: 'EUR',
      textProps: { style: styles.text, testID: 'amount' },
    }),
    h(
      Pressable,
      {
        accessibilityRole: 'button',
        accessibilityLabel: gt('Add an item'),
        onPress: add,
        style: styles.button,
      },
      h(Text, { style: styles.buttonText }, gt('Add an item'))
    ),
    h(
      Text,
      { style: styles.status, testID: 'stored' },
      gt('Stored language: {locale}', { locale: selector.locale })
    ),
    h(Text, { accessibilityRole: 'alert', style: styles.status }, status)
  );
}

await native.initialize();
createRoot(document.getElementById('app')).render(
  h(native.Provider, null, h(App))
);
