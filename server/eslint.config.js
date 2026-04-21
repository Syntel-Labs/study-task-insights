import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
      eqeqeq: "error",
      "no-eval": "error",
      "no-var": "error",
      "prefer-const": "error",
    },
  },
  {
    ignores: ["node_modules/**", "generated/**", "prisma/**"],
  },
];
