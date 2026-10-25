import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(process.cwd(), ".") } },
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["backend/lib/**/*.ts", "app/api/**/*.ts"],
      exclude: ["**/*.d.ts", "backend/lib/db.ts"],
      thresholds: { lines: 80, functions: 80, branches: 70 },
    },
  },
});
