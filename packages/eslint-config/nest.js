/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./index.js'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: process.cwd(),
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^_' }],
  },
};
