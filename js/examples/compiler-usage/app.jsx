import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createTranslator } from '../../src/messages.js';
import { I18nProvider, LocaleSelector, useGT } from 'lino-i18n/react';

const i18n = createTranslator({
  locales: {
    en: {},
    fr: {
      'Automatic source translation': 'Traduction automatique des textes',
      'Hello <c0>{auto0}</c0>!': 'Bonjour <c0>{auto0}</c0> !',
      'Items: <c0>{auto0}</c0>': 'Articles : <c0>{auto0}</c0>',
      'Add an item': 'Ajouter un article',
      Search: 'Rechercher',
      'Search for {v0}': 'Rechercher {v0}',
    },
  },
});

function Page() {
  const gt = useGT();
  const [count, setCount] = useState(2);
  const name = 'Ada';
  return (
    <main>
      <header>
        <span className="label">LINO I18N · COMPILER</span>
        <LocaleSelector />
      </header>
      <h1>Automatic source translation</h1>
      <p>
        Hello <strong>{name}</strong>!
      </p>
      <input placeholder="Search" aria-label={`Search for ${name}`} />
      <section>
        <p>
          Items: <strong>{count}</strong>
        </p>
        <button onClick={() => setCount(count + 1)}>Add an item</button>
      </section>
    </main>
  );
}
createRoot(document.getElementById('app')).render(
  <I18nProvider i18n={i18n}>
    <Page />
  </I18nProvider>
);
