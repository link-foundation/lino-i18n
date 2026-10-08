import { createTranslator } from 'lino-i18n/messages';
import { T, Var, Branch } from 'lino-i18n/react';

const { gt } = createTranslator();

export function greeting(name, kind) {
  const plain = gt('Hello {name}', { name });
  return (
    <T>
      Hello <Var name="name">{name}</Var>
      <Branch
        name="kind"
        value={kind}
        cases={{ friend: 'friend', other: 'guest' }}
      />
      <Var name="plain">{plain}</Var>
    </T>
  );
}
