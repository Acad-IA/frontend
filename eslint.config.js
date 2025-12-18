//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import eslintConfigPrettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'

export default [
  ...tanstackConfig,
  // Local overrides to avoid rule overlap and Prettier conflicts
  {
    plugins: {
      import: importPlugin, // <--- Registramos el plugin
    },
    rules: {
      // Let import/order handle ordering; disable native sort-imports to prevent conflicts
      'sort-imports': 'off',
      // Ensure consistent grouping and alphabetical ordering
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          // No blank lines inside or between import groups to avoid multi-save fixes
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  // Turn off any ESLint rules that might conflict with Prettier
  eslintConfigPrettier,
]
