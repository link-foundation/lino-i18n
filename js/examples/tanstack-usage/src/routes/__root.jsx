import {
  createRootRoute,
  Outlet,
  HeadContent,
  Scripts,
  useRouterState,
} from '@tanstack/react-router';
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Lino TanStack example' },
    ],
    links: [{ rel: 'icon', href: 'data:,' }],
  }),
  component: () => <Outlet />,
  shellComponent: Document,
});
function Document({ children }) {
  const locale = useRouterState({
    select: (state) =>
      state.matches.find((match) => match.loaderData?.snapshot)?.loaderData
        .snapshot.defaultLocale || 'en',
  });
  return (
    <html lang={locale}>
      <head>
        <HeadContent />
        <style>{`body{margin:0;background:#edf1f5;color:#142333;font:18px/1.6 system-ui,sans-serif}main{max-width:740px;margin:64px auto;padding:40px;border-radius:20px;background:white}h1{font-size:36px;line-height:1.2}button,select{font:inherit;padding:10px 14px;border-radius:8px;border:1px solid #c1cddb}button{background:#214ed3;color:white}nav{display:flex;gap:24px;margin-top:28px}label{display:flex;justify-content:space-between;align-items:center}.label{font-size:12px;letter-spacing:2px;color:#53677a}`}</style>
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
