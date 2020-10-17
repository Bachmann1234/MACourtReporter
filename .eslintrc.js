module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: 'standard-with-typescript',
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    '@typescript-eslint/no-redeclare': 'off',
    semi: 'off',
    '@typescript-eslint/semi': ['error', 'always'],
    'no-var': 2
  }
};
