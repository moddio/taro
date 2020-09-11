module.exports = {
  arrowParens: 'avoid',
  endOfLine: 'lf',
  bracketSpacing: true,
  jsxBracketSameLine: true,
  singleQuote: true,
  trailingComma: 'all',
  tabWidth: 4,
  printWidth: 400,
  proseWrap: 'preserve',
  semi: true,
  useTabs: false,
  overrides: [
      {
          files: '*.json',
          options: {
              printWidth: 200,
          },
      },
  ],
};
