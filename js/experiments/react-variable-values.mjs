// Compare opaque translation variables with React's native child rendering.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator } from '../src/messages.js';
import { T, Var } from '../src/react-server.js';

for (const value of [false, true, null, undefined, 0, ['A', 'B']]) {
  const native = renderToStaticMarkup(
    React.createElement('p', null, 'Value: ', value)
  );
  const translated = renderToStaticMarkup(
    React.createElement(
      'p',
      null,
      React.createElement(
        T,
        { i18n: createTranslator() },
        'Value: ',
        React.createElement(Var, { name: 'value' }, value)
      )
    )
  );
  console.log(JSON.stringify({ value, native, translated }));
}
