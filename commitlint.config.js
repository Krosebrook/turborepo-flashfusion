module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Enforce conventional commit format
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'revert',
        'style',
        'test'
      ]
    ],
    // Limit subject line length
    'subject-max-length': [2, 'always', 72],
    'subject-case': [2, 'always', 'lower-case'],
    // Enforce body line length
    'body-max-line-length': [2, 'always', 100],
    // Custom rules for commit size awareness
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    // Add custom header pattern to encourage scope usage
    'header-max-length': [2, 'always', 100]
  }
};