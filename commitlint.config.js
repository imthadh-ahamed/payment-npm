/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Keeps commit subjects skimmable in `git log --oneline` and changelogs.
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0, 'always', Infinity],
  },
};
