module.exports = {
  root: true,
  // This tells ESLint to load the config from the nearest package-specific config
  extends: [],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '.turbo/', '.next/'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
  },
};