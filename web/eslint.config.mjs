import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // False-positives: router.replace/push in effects is fine
      'react-hooks/set-state-in-effect': 'off',
      // Allow `any` for Supabase response typing
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow unescaped entities (JSX text)
      'react/no-unescaped-entities': 'off',
    },
  },
]);

export default eslintConfig;
