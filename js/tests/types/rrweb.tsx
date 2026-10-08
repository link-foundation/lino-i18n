import type { RecorderBundle } from 'lino-i18n/rrweb';
import type { eventWithTime } from '@rrweb/types';
import { T, Var, Recorder, useRecorder } from 'lino-i18n/rrweb';
import { GTReplayer, createGTReplayer } from 'lino-i18n/rrweb/replay';
import { toReplayCatalog, createReplayLoader } from 'lino-i18n/rrweb/catalog';
import { harvestReplay } from 'lino-i18n/rrweb/harvest';
const sources = { greeting: 'Hello {name}' };
const catalog = toReplayCatalog({ greeting: 'Bonjour {name}' }, { sources });
const loadTranslations = createReplayLoader(
  async () => 'fr\n  Hello "Bonjour"'
);
const events: eventWithTime[] = [];
await harvestReplay(events, ['en', 'fr'], {
  loadCatalog: () => 'fr\n  Hello "Bonjour"',
  maxEvents: 10,
});
function Capture() {
  const { start } = useRecorder();
  const complete = (bundle: RecorderBundle) => console.log(bundle.overlay.fr);
  return (
    <>
      <T>
        Hello <Var name="name">Ada</Var>
      </T>
      <Recorder onComplete={complete} catalogs={{ sources }} />
      <button onClick={() => start({ locales: ['en', 'fr'] })}>Record</button>
    </>
  );
}
const replay = <GTReplayer bundle={{ events }} initialLocale="fr" />;
createGTReplayer(document.createElement('div'), { events }).destroy();
console.log(catalog, loadTranslations, Capture, replay);
// @ts-expect-error catalogs contain strings
toReplayCatalog({ Hello: 42 });
// @ts-expect-error locales contain names
harvestReplay(events, [42]);
// @ts-expect-error capture uses catalog options rather than raw GT harvest encodings
const invalid = <Recorder harvest={{}} />;
console.log(invalid);
