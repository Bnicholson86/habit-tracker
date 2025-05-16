module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'prettier'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'prettier/prettier': 'warn',
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'off', // Using TypeScript for prop types
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}; 