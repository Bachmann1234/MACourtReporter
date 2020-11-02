module.exports = {
  root: true,
  plugins: ['@typescript-eslint', 'jest', 'eslint-comments'],
  extends: [
    'airbnb-typescript',
    'prettier',
    'prettier/@typescript-eslint',
    'plugin:jest/recommended',
    'plugin:eslint-comments/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {}
};
