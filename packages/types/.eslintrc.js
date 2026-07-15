/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['@iot-deviceshield/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
