import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createTranslator } from 'lino-i18n/messages';
import { I18nProvider, T, Var, Recorder, useRecorder } from 'lino-i18n/rrweb';
import { GTReplayer } from 'lino-i18n/rrweb/replay';

const h = React.createElement;
const i18n = createTranslator();
const catalogs = {
  sourceLocale: 'en',
  sources: { greeting: 'Hello <c0>{name}</c0>!', count: 'Items: {count}' },
  loadCatalog: async (locale) => {
    const response = await fetch(`./${locale}.lino`);
    if (!response.ok) {
      throw new Error(`Catalog unavailable: ${locale}`);
    }
    return response.text();
  },
};

function App() {
  const recorder = useRecorder();
  const [count, setCount] = useState(0);
  const [bundle, setBundle] = useState(null);
  const [replaying, setReplaying] = useState(false);
  const [locale, setLocale] = useState('fr');
  const [error, setError] = useState('');
  function complete(value) {
    window.replayBundle = value;
    setBundle(value);
  }
  return h(
    'div',
    { className: 'layout' },
    h(
      'div',
      { className: 'toolbar' },
      h('span', { className: 'brand' }, 'Links Notation / session replay'),
      h(
        'button',
        {
          onClick: () => recorder.start({ locales: ['en', 'fr'] }),
          disabled: recorder.status !== 'idle',
        },
        'Record walkthrough'
      ),
      h(
        'button',
        { onClick: () => recorder.stop(), disabled: !recorder.isRecording },
        'Stop recording'
      ),
      h(
        'button',
        { onClick: () => setReplaying(!replaying), disabled: !bundle },
        replaying ? 'Close replay' : 'Open replay'
      ),
      h(
        'select',
        {
          'aria-label': 'Replay language',
          value: locale,
          onChange: (event) => setLocale(event.target.value),
        },
        h('option', { value: 'en' }, 'English'),
        h('option', { value: 'fr' }, 'Français')
      )
    ),
    h(
      'main',
      null,
      h('p', { className: 'eyebrow' }, 'SOURCE WALKTHROUGH'),
      h('h1', null, 'A recorded welcome'),
      h(
        'h2',
        null,
        h(
          T,
          { id: 'greeting' },
          'Hello ',
          h('strong', null, h(Var, { name: 'name' }, 'Ada')),
          '!'
        )
      ),
      h(
        'p',
        { id: 'count' },
        h(T, { id: 'count', source: 'Items: {count}', values: { count } })
      ),
      h('button', { onClick: () => setCount(count + 1) }, 'Add an item'),
      h(
        'label',
        null,
        'Private input',
        h('input', {
          'aria-label': 'Private input',
          defaultValue: 'private-value-6741',
        })
      ),
      h('p', { className: 'rr-block' }, 'private-block-1958')
    ),
    error && h('p', { role: 'alert' }, error),
    h(Recorder, {
      catalogs,
      expose: 'linoRecorder',
      contentSelector: 'main',
      onComplete: complete,
      onError: (err) => setError(err.message),
    }),
    replaying &&
      h(
        'section',
        { id: 'replay' },
        h('p', { className: 'eyebrow' }, 'TRANSLATED REPLAY'),
        h(GTReplayer, {
          bundle,
          initialLocale: locale,
          switchLocalesAllowed: true,
          debug: false,
          style: { height: 540 },
        })
      )
  );
}
createRoot(document.getElementById('root')).render(
  h(I18nProvider, { i18n }, h(App))
);
