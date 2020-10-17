module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'jest',
    'eslint-comments',
    'import',
    'node'
  ],
  extends: [
    'standard-with-typescript', 
    'prettier', 
    'prettier/@typescript-eslint',
    'plugin:jest/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:import/typescript',
    'plugin:node/recommended'
  ],
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
