import fs from "node:fs";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !databaseUrl.startsWith("file:")) {
  throw new Error("DATABASE_URL must use Prisma SQLite's file: URL for this app.");
}

const configuredPath = decodeURIComponent(databaseUrl.slice("file:".length).split("?")[0]);
const databasePath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.resolve(process.cwd(), "prisma", configuredPath);
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
if (!fs.existsSync(databasePath)) fs.closeSync(fs.openSync(databasePath, "a"));
