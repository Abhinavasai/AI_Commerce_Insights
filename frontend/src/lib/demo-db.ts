import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

let db: Database.Database | null = null;

function seedSourcePath(): string {
  return path.join(process.cwd(), "data", "demo.db");
}

function runtimeDbPath(): string {
  // Vercel filesystem is read-only except /tmp — copy seed DB there.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "commerce-demo.db");
  }
  // Local next dev/build: use a writable copy next to the seed
  return path.join(process.cwd(), "data", "commerce-runtime.db");
}

function ensureRuntimeDb(): string {
  const source = seedSourcePath();
  const target = runtimeDbPath();
  if (!fs.existsSync(source)) {
    throw new Error(
      `Demo database missing at ${source}. Commit frontend/data/demo.db.`
    );
  }
  // Refresh runtime copy when seed is newer or runtime missing
  const needsCopy =
    !fs.existsSync(target) ||
    fs.statSync(source).mtimeMs > fs.statSync(target).mtimeMs;
  if (needsCopy) {
    fs.copyFileSync(source, target);
  }
  return target;
}

export function getDemoDb(): Database.Database {
  if (db) return db;
  const file = ensureRuntimeDb();
  db = new Database(file, { readonly: false, fileMustExist: true });
  db.pragma("journal_mode = WAL");
  return db;
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}
