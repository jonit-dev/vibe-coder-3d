import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'public/**',
      'html/**',
      '.DS_Store',
      'coverage/**',
      '*.log',
      'scripts/**',
      'test-script-api.mjs',
      'test-integration.ts',
      'rust/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        jsx: true,
      },
      globals: {
        document: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'prettier/prettier': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
        },
      ],
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/game/**/*',
              from: './src/core/**/*',
              except: [
                '**/index.ts',
                '**/lib/extension/**/*',
                '**/lib/input/inputTypes.ts',
                '**/lib/serialization/assets/**/*',
                '**/types/components.ts',
                '**/materials/Material.types.ts',
                '**/prefabs/Prefab.types.ts',
                '**/lib/rendering/shapes/IShapeDescriptor.ts',
              ],
              message:
                'Game code can only import from @core/* public API or @core/lib/extension/*. Use @core/* instead of deep imports.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/__tests__/**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['src/game/scripts/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      // External scripts are standalone and may declare duplicate global lifecycle functions
      // Ensure parser doesn't attempt full type-aware linting using the project config here
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  prettierConfig,
];
