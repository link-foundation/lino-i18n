import { createFileRoute, Outlet, notFound } from '@tanstack/react-router';
import { TanStackI18nProvider } from 'lino-i18n/tanstack-start/client';
import { snapshot } from '../functions.js';
export const Route = createFileRoute('/$locale')({
  beforeLoad: ({ params }) => {
    if (!['en', 'fr'].includes(params.locale)) {
      throw notFound();
    }
  },
  loader: async ({ params }) => ({
    snapshot: await snapshot({ data: params.locale }),
  }),
  component: Layout,
});
function Layout() {
  const data = Route.useLoaderData();
  return (
    <TanStackI18nProvider snapshot={data.snapshot}>
      <Outlet />
    </TanStackI18nProvider>
  );
}
