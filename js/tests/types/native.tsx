import type { ComponentType, ReactNode } from 'react';
// The injected Text component's own props must survive the adapter's inference.
declare const Text: ComponentType<{
  children?: ReactNode;
  style?: { fontSize?: number };
  accessibilityRole?: 'header' | 'text';
  testID?: string;
}>;
declare const View: ComponentType<{ children?: ReactNode }>;
import { createNativeI18n, useGT } from 'lino-i18n/react-native';
const native = createNativeI18n({
  Text,
  storage: {
    getItem: async () => 'fr',
    setItem: async (_key, _value) => {},
  },
  locales: { fr: { Hello: 'Bonjour' } },
});
async function initialize() {
  const locale: string = await native.initialize();
  return locale;
}
void initialize;
function App() {
  const gt = useGT();
  const selection = native.useLocaleSelector();
  selection.setLocale('fr');
  return (
    <native.Provider>
      <View>
        <native.T
          textProps={{ style: { fontSize: 18 }, accessibilityRole: 'header' }}
        >
          {gt('Hello')}
        </native.T>
        <native.Currency
          value={0}
          currency="EUR"
          textProps={{ testID: 'amount' }}
        />
      </View>
    </native.Provider>
  );
}
void App;
// @ts-expect-error currency is required
<native.Currency value={0} />;
// @ts-expect-error Text props retain their native types
<native.T textProps={{ style: { fontSize: 'large' } }}>Hello</native.T>;
// @ts-expect-error a native component is required
createNativeI18n({ Text: 'span' });
