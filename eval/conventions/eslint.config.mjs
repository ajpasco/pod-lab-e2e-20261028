import js from '@eslint/js';

const baseRules = {
  ...js.configs.recommended.rules,
  'max-lines': ['error', { max: 300, skipBlankLines: false, skipComments: false }],
  'max-lines-per-function': ['error', { max: 50 }],
  complexity: ['error', 10],
  camelcase: 'error',
  'no-warning-comments': ['error', { terms: ['todo', 'fixme'], location: 'anywhere' }],
  'no-empty': 'error',
  'no-unsafe-finally': 'error',
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          regex: '^(?!node:|\\.\\.?/).*',
          message: 'only node: and relative imports',
        },
      ],
    },
  ],
};

export default [
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { process: 'readonly', console: 'readonly' },
    },
    linterOptions: { noInlineConfig: true },
    rules: baseRules,
  },
  {
    files: ['**/app/shelf.mjs'],
    rules: {
      'no-restricted-imports': ['error', {
          patterns: [
            {
              regex: '^(?!\\./src/shelf\\.mjs$).*',
              message: 'the boundary imports only ./src/shelf.mjs',
            },
          ],
        }],
    },
  },
  {
    files: ['**/app/src/shelf.mjs'],
    rules: {
      'no-restricted-imports': ['error', {
          patterns: [
            {
              regex: '^(?!\\./store\\.mjs$).*',
              message: 'the rules import only ./store.mjs',
            },
          ],
        }],
      'no-restricted-globals': ['error', 'process', 'console'],
    },
  },
  {
    files: ['**/app/src/store.mjs'],
    rules: {
      'no-restricted-imports': ['error', {
          patterns: [
            {
              regex: '^(?!node:).*',
              message: 'the store imports only node: modules',
            },
          ],
        }],
      'no-restricted-globals': ['error', 'process', 'console'],
    },
  },
];
