/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['@iot-deviceshield/eslint-config/nest'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
