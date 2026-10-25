import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
  ...tseslint.configs.recommended,
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "playwright-report/**", "test-results/**", "next-env.d.ts"]),
);
