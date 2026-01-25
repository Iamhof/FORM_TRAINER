const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const importPlugin = require('eslint-plugin-import');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ["dist/*", "supabase/migrations/**"],
  },
  {
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling"],
            "index",
            "object",
            "type",
          ],
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],
      "no-console": [
        "error",
        { allow: ["warn", "error", "info"] },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "no-console": "off",
    },
  },
]);
