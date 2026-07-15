/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./index.js'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: process.cwd(),
  },
  rules: {
    // NestJS controllers/services rely on decorator metadata; unused imports are fine there.
    '@typescript-eslint/no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^_' }],
  },
};
