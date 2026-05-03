// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const importX = require('eslint-plugin-import-x')
const unusedImports = require('eslint-plugin-unused-imports')
const prettierConfig = require('eslint-config-prettier')

module.exports = defineConfig([
  expoConfig,
  {
    plugins: {
      'import-x': importX,
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'import/no-unresolved': 'off',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'import-x/no-internal-modules': [
        'error',
        {
          allow: ['app/**', 'assets/**', '@expo/**', '@langchain/**', 'react-native/**'],
        },
      ],
    },
  },
  prettierConfig,
  {
    ignores: ['dist/*'],
  },
])
