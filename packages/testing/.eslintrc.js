module.exports = {
  extends: ['../../.eslintrc.js'],
  env: {
    node: true,
    jest: true
  },
  rules: {
    // Testing package specific rules
    'no-console': 'off', // Allow console in tests
    '@typescript-eslint/no-explicit-any': 'off', // Test fixtures may use any
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }]
  }
};