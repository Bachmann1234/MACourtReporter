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
    'node/no-unsupported-features/es-syntax': 0
  }
};
