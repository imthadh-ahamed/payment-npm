/** @type {import('lint-staged').Configuration} */
export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
};
