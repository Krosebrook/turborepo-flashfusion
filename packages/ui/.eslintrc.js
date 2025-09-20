module.exports = {
  extends: ['../../.eslintrc.js'],
  env: {
    browser: true,
    es2020: true
  },
  extends: ['../../.eslintrc.js', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    // UI component specific rules
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react/react-in-jsx-scope': 'off' // Not needed with React 17+
  }
};