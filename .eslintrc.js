module.exports = {
  root: true,
  plugins: ['@typescript-eslint', 'jest', 'eslint-comments', 'import', 'node'],
  extends: [
    'airbnb-typescript',
    'prettier',
    'prettier/@typescript-eslint',
    'plugin:jest/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:import/typescript',
    'plugin:node/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    '@typescript-eslint/no-redeclare': 'off',
    semi: 'off',
    '@typescript-eslint/semi': ['error', 'always'],
    'no-var': 2,
    'node/no-unsupported-features/es-syntax': 0,
    'guard-for-in': 2,
    'no-restricted-globals': 2
  }
};
