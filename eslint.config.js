import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist",
      "**/node_modules",
      "client/src-tauri",
      "docs",
      "telefono/.expo",
      "telefono/ios",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["api/**/*.ts", "condiviso/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["telefono/metro.config.js"],
    languageOptions: { globals: globals.node, sourceType: "commonjs" },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["client/src/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
);
