import { i18n } from '../../../i18n.js';
export async function GET() {
  const translator = await i18n.getTranslator();
  await new Promise((resolve) => setImmediate(resolve));
  return Response.json({
    locale: translator.getLocale(),
    message: translator.gt('Hello from the server'),
  });
}
