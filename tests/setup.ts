import "@testing-library/jest-dom/vitest";
process.env.DATABASE_URL ??= "file:./test.db";
process.env.GEMINI_API_KEY ??= "test-key";
