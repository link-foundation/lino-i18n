import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createTranslator } from '../../src/messages.js';
import { loadCatalogs } from '../../src/browser.js';
import {
  I18nProvider,
  T,
  Var,
  Plural,
  LocaleSelector,
  Currency,
  useGT,
  useLocale,
  useLocaleDirection,
} from '../../src/react.js';

const h = React.createElement;
const locales = await loadCatalogs(['./en.lino', './fr.lino']);
const i18n = createTranslator({ locales });

function App() {
  const [count, setCount] = useState(2);
  const gt = useGT();
  const locale = useLocale();
  const direction = useLocaleDirection();
  return h(
    'main',
    { lang: locale, dir: direction },
    h('div', { className: 'eyebrow' }, 'Links Notation / React'),
    h(
      'h1',
      null,
      h(
        T,
        { id: 'welcome' },
        'Welcome, ',
        h('strong', null, h(Var, { name: 'name' }, 'Ada')),
        '!'
      )
    ),
    h(
      'div',
      { className: 'controls' },
      h(LocaleSelector, { labels: { en: 'English', fr: 'Français' } }),
      h('button', { onClick: () => setCount(count + 1) }, gt('Add an item'))
    ),
    h(
      'div',
      { className: 'receipt' },
      h(
        'p',
        { id: 'items' },
        h(
          T,
          { id: 'cart' },
          h(Plural, {
            count,
            one: '1 item in your cart',
            other: `${count} items in your cart`,
          })
        )
      ),
      h(
        'p',
        { id: 'total' },
        h(
          T,
          { id: 'total' },
          'Total: ',
          h(
            Var,
            { name: 'amount' },
            h(Currency, { currency: 'EUR' }, count * 12.5)
          )
        )
      )
    ),
    h(
      'a',
      { href: 'https://github.com/link-foundation/lino-i18n' },
      gt('Read the guide')
    )
  );
}

createRoot(document.getElementById('root')).render(
  h(I18nProvider, { i18n }, h(App))
);
