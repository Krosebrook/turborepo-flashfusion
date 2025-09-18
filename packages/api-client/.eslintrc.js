module.exports = {
  extends: ['../../.eslintrc.js'],
  env: {
    node: true
  },
  rules: {
    // API client specific rules
    'no-console': 'off', // Allow console logging for debugging
    '@typescript-eslint/no-explicit-any': 'off' // API responses may have any type
  }
};