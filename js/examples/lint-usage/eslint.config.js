import lino from 'lino-i18n/eslint';

export default [
  {
    ...lino.configs.recommended,
    files: ['**/*.jsx'],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  },
];
