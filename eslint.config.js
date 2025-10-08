// ESLint flat config (v9)
// Configuration minimale pour linter JS/TS de ce dépôt sans plugins additionnels.

export default [
  {
    ignores: [
      'dist/**',
      'playwright-report/**',
      'test-results/**',
      'node_modules/**',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parser: require.resolve('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: { decorators: true },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        CustomEvent: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      // Règles raisonnables et non bloquantes
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-constant-condition': ['warn', { checkLoops: false }],
      'no-console': 'off',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'smart'],
      // Ajout pour décorateurs TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        CustomEvent: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
      },
    },
    rules: {
      // Règles raisonnables et non bloquantes
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-constant-condition': ['warn', { checkLoops: false }],
      'no-console': 'off',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'smart'],
    },
  },
];
