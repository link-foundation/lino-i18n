import {
  computed,
  defineComponent,
  h,
  inject,
  onScopeDispose,
  shallowRef,
  ssrContextKey,
} from 'vue';
import { createTranslator } from './messages.js';
import { scopedDictionary } from './dictionary.js';
import { renderContent, selectPlural } from './content.js';
import { prepareVueContent, branchProps } from './vue-content.js';
import { formatList, formatRelativeTimeFromDate } from './intl.js';

const contextKey = Symbol('lino-i18n Vue');

export function createVueI18n({ i18n: provided, ...options } = {}) {
  const i18n = provided || createTranslator(options);
  if (!i18n?.gt || !i18n?.subscribe) {
    throw new TypeError('createVueI18n requires a createTranslator instance');
  }
  const sourceLocale =
    options.sourceLocale || i18n.snapshot().sourceLocale || 'en';
  const switchLocale = (locale) => {
    if (locale === sourceLocale) {
      i18n.setLocale(locale);
      return Promise.resolve(locale);
    }
    return i18n.switchLocale(locale);
  };
  return {
    i18n,
    gt: i18n.gt,
    m: i18n.m,
    initialize: () =>
      i18n.getLocale() === sourceLocale
        ? Promise.resolve(sourceLocale)
        : i18n.load(i18n.getLocale()),
    install: (app) =>
      app.provide(contextKey, { i18n, switchLocale, sourceLocale }),
  };
}

function useContext() {
  const context = inject(contextKey, null);
  if (!context) {
    throw new Error('lino-i18n composables require the Vue plugin');
  }
  const { i18n, switchLocale, sourceLocale } = context;
  const revision = shallowRef(i18n.getRevision());
  // SSR renders are synchronous snapshots; never retain request subscribers.
  if (!inject(ssrContextKey, null)) {
    onScopeDispose(
      i18n.subscribe(() => {
        revision.value = i18n.getRevision();
      })
    );
  }
  return Object.assign(
    () => {
      revision.value;
      return i18n;
    },
    { switchLocale, sourceLocale }
  );
}

export function useI18n() {
  return useContext()();
}
function state(method) {
  const active = useContext();
  return computed(() => active()[method]());
}
export function useLocale() {
  return state('getLocale');
}
export function useLocales() {
  const active = useContext();
  return computed(() => [
    ...new Set([active.sourceLocale, ...active().listLocales()]),
  ]);
}
export function useRegion() {
  return state('getRegion');
}
export function useEnabled() {
  return state('getEnabled');
}
export function useDefaultLocale() {
  return state('getDefaultLocale');
}
export function useLocaleDirection() {
  const active = useContext();
  return computed(() =>
    active().getLocaleConfig().getLocaleDirection(active().getLocale())
  );
}
export function useLocaleProperties() {
  const active = useContext();
  return computed(() =>
    active().getLocaleConfig().getLocaleProperties(active().getLocale())
  );
}
export function useSetLocale() {
  return useContext().switchLocale;
}
export function useSetRegion() {
  return useI18n().setRegion;
}
export function useSetEnabled() {
  return useI18n().setEnabled;
}
export function useGT() {
  const active = useContext();
  return (...args) => active().gt(...args);
}
export const useMessages = useGT;
export function useTranslations(prefix = '') {
  return scopedDictionary(useContext(), prefix);
}

function component(name, props, setup, marker) {
  if (props.includes('ordinal')) {
    props = {
      ...Object.fromEntries(props.map((key) => [key, null])),
      ordinal: Boolean,
    };
  }
  const result = defineComponent({ name, props, inheritAttrs: false, setup });
  if (marker) {
    result.linoContentMarker = marker;
  }
  return result;
}

export const T = component(
  'LinoT',
  ['id', 'source', 'values', 'locale', 'description'],
  (props, { slots }) => {
    const active = useContext();
    return () =>
      renderContent(
        active(),
        { ...props, children: slots.default?.() },
        prepareVueContent
      );
  }
);
export const Var = component(
  'LinoVar',
  ['name', 'value'],
  (props, { slots }) =>
    () =>
      slots.default?.() ?? props.value ?? null,
  'variable'
);
export const Static = Var;
export const Derive = component(
  'LinoDerive',
  [],
  (_, { slots }) =>
    () =>
      slots.default?.(),
  'derive'
);
export const Branch = component(
  'LinoBranch',
  ['name', 'value', 'cases'],
  (props, { slots }) =>
    () => {
      const { cases } = branchProps(props, slots);
      return cases[String(props.value)] ?? cases.other ?? null;
    },
  'branch'
);
export const Plural = component(
  'LinoPlural',
  [
    'name',
    'count',
    'ordinal',
    'locale',
    'cases',
    'zero',
    'one',
    'two',
    'few',
    'many',
    'other',
  ],
  (props, { slots }) => {
    const active = useContext();
    return () =>
      selectPlural(
        formatLocale(active(), props.locale),
        branchProps(props, slots, true)
      );
  },
  'plural'
);

function formatLocale(i18n, locale) {
  return locale
    ? i18n.getLocaleConfig().resolveCanonicalLocale(locale)
    : i18n.getFormatLocale();
}
function formatter(name, props, format) {
  return component(name, ['value', 'locale', 'options', ...props], (values) => {
    const active = useContext();
    return () => format(formatLocale(active(), values.locale), values);
  });
}
export const NumberFormat = formatter('LinoNumber', [], (locale, props) =>
  new Intl.NumberFormat(locale, props.options).format(props.value)
);
export const CurrencyFormat = formatter(
  'LinoCurrency',
  ['currency'],
  (locale, props) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: props.currency,
      ...props.options,
    }).format(props.value)
);
export const DateTimeFormat = formatter('LinoDateTime', [], (locale, props) =>
  new Intl.DateTimeFormat(locale, props.options).format(props.value)
);
export const RelativeTimeFormat = formatter(
  'LinoRelativeTime',
  ['unit'],
  (locale, props) =>
    new Intl.RelativeTimeFormat(locale, props.options).format(
      props.value,
      props.unit
    )
);
export const RelativeDate = formatter(
  'LinoRelativeDate',
  ['now'],
  (locale, props) => {
    if (props.now === undefined) {
      throw new TypeError('RelativeDate requires an explicit now');
    }
    return formatRelativeTimeFromDate(
      props.value,
      props.now,
      locale,
      props.options
    );
  }
);
export const ListFormat = formatter('LinoList', ['values'], (locale, props) =>
  formatList(props.values, locale, props.options)
);

function selector(name, props, getValue, getOptions, setValue) {
  return component(name, props, (values, { attrs, emit }) => {
    const active = useContext();
    return () =>
      h(
        'select',
        {
          'aria-label': name === 'LinoLocaleSelector' ? 'Language' : 'Region',
          ...attrs,
          value: getValue(active()),
          onChange: async (event) => {
            try {
              await setValue(active, event.target.value);
              emit('change', event);
            } catch (error) {
              // Restore the visible selection if a lazy catalog failed to load.
              event.target.value = getValue(active());
              emit('error', error);
            }
          },
        },
        getOptions(active(), values).map((code) =>
          h('option', { value: code, key: code }, values.labels?.[code] || code)
        )
      );
  });
}
export const LocaleSelector = selector(
  'LinoLocaleSelector',
  ['locales', 'labels', 'onChange', 'onError'],
  (i18n) => i18n.getLocale(),
  (i18n, props) =>
    props.locales || [
      ...new Set([i18n.snapshot().sourceLocale || 'en', ...i18n.listLocales()]),
    ],
  (active, code) => active.switchLocale(code)
);
export const RegionSelector = selector(
  'LinoRegionSelector',
  ['regions', 'labels', 'onChange', 'onError'],
  (i18n) => i18n.getRegion() || '',
  (_, props) => props.regions,
  (active, code) => active().setRegion(code)
);

export {
  NumberFormat as Num,
  CurrencyFormat as Currency,
  DateTimeFormat as DateTime,
  RelativeTimeFormat as RelativeTime,
};
