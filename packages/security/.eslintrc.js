module.exports = {
  extends: ['../../.eslintrc.js'],
  env: {
    node: true
  },
  rules: {
    // Security package specific rules
    'no-console': 'error', // No console logs in security code
    '@typescript-eslint/no-explicit-any': 'error', // Strict typing for security
    '@typescript-eslint/explicit-function-return-type': 'warn' // Explicit return types
  }
};