import { createFileRoute } from '@tanstack/react-router';
import { T, LocaleLink } from 'lino-i18n/tanstack-start/client';
export const Route = createFileRoute('/$locale/details')({
  component: Details,
});
function Details() {
  return (
    <main id="content">
      <h1>
        <T>TanStack source translation</T>
      </h1>
      <LocaleLink to="/">Home</LocaleLink>
    </main>
  );
}
