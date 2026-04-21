import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        fetch: "readonly",
        URL: "readonly",
        FormData: "readonly",
        AbortController: "readonly",
        import: "readonly",
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
      eqeqeq: "error",
      "no-eval": "error",
      "no-var": "error",
      "prefer-const": "error",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    ignores: ["node_modules/**", "dist/**", "public/**"],
  },
];
