'use client';
import { useState } from 'react';
import {
  LocaleSelector,
  LocaleLink,
  useGT,
  T,
  Var,
} from 'lino-i18n/next/client';
export default function Client() {
  const gt = useGT();
  const [count, setCount] = useState(0);
  return (
    <section>
      <p>
        <T>
          Hello <Var name="name">Ada</Var>
        </T>
      </p>
      <label>
        Language{' '}
        <LocaleSelector
          aria-label="Language"
          labels={{ en: 'English', fr: 'Français' }}
        />
      </label>
      <p>
        <button onClick={() => setCount(count + 1)}>
          {gt('Count {count}', { count })}
        </button>
      </p>
      <LocaleLink href="/static?from=home#content">Static route</LocaleLink>
      <p>
        <LocaleLink
          href="/static"
          locale="fr"
          prefetch={true}
          data-testid="foreign-link"
        >
          French static route
        </LocaleLink>
      </p>
      <LocaleLink
        href="/static"
        locale="fr"
        onNavigate={(event) => event.preventDefault()}
        data-testid="blocked-link"
      >
        Cancelled navigation
      </LocaleLink>
    </section>
  );
}
