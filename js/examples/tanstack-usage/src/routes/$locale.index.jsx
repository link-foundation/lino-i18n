import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  T,
  Var,
  useGT,
  LocaleSelector,
  LocaleLink,
  Currency,
} from 'lino-i18n/tanstack-start/client';
import { serverGreeting } from '../functions.js';
export const Route = createFileRoute('/$locale/')({ component: Home });
function Home() {
  const gt = useGT();
  const [count, setCount] = useState(0);
  const [server, setServer] = useState('');
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return (
    <main data-hydrated={hydrated}>
      <span className="label">LINO · TANSTACK START</span>
      <h1>
        <T>TanStack source translation</T>
      </h1>
      <label>
        Language
        <LocaleSelector
          aria-label="Language"
          labels={{ en: 'English', fr: 'Français' }}
        />
      </label>
      <p>
        <T>
          Hello <Var name="name">Ada</Var>
        </T>
      </p>
      <p>
        <Currency value={0} currency="EUR" />
      </p>
      <button onClick={() => setCount(count + 1)}>
        {gt('Count {count}', { count })}
      </button>
      <button onClick={async () => setServer((await serverGreeting()).message)}>
        Server greeting
      </button>
      <p role="status">{server}</p>
      <nav>
        <LocaleLink to="/details" search={{ from: 'home' }} hash="content">
          Details
        </LocaleLink>
        <LocaleLink
          to="/details"
          locale="fr"
          preload="intent"
          data-testid="foreign-link"
        >
          French details
        </LocaleLink>
        <LocaleLink
          to="/details"
          locale="fr"
          onClick={(event) => event.preventDefault()}
          data-testid="blocked-link"
        >
          Cancelled
        </LocaleLink>
      </nav>
    </main>
  );
}
