import "dotenv/config";
import { spawn } from "node:child_process";
import { sql, mongo } from "../src/lib/db";
import { migrate } from "./migrate";
import { setup } from "../database/mongo/setup";
if (
  !process.env.TEST_DATABASE_URL ||
  !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("_test") ||
  !process.env.TEST_MONGODB_URI ||
  !process.env.TEST_MONGODB_DB?.endsWith("_test")
)
  throw new Error("Disposable test databases must be explicitly configured");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI;
process.env.MONGODB_DB = process.env.TEST_MONGODB_DB;
process.env.APP_ORIGIN = "http://localhost:3001";
await migrate();
await setup(await mongo());
await sql().end();
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", "3001"],
  { stdio: "inherit", env: process.env, windowsHide: true },
);
process.once("SIGINT", () => server.kill());
process.once("SIGTERM", () => server.kill());
server.once("exit", (code) => process.exit(code || 0));
