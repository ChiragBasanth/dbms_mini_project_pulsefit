import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { createConnection } from "node:net";
import {
  mkdir,
  writeFile,
  copyFile,
  readdir,
  readFile,
  unlink,
} from "node:fs/promises";
import { parse } from "dotenv";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { MongoMemoryServer } from "mongodb-memory-server";
// Optional portable development runtimes. No system service installation.
await mkdir("work", { recursive: true });
await mkdir("work/mongo", { recursive: true });
await mkdir("work/mongodb-binaries", { recursive: true });
const extension = path.resolve("work/pgvector-pg18");
if (process.platform === "win32") {
  const native = path.resolve(
    "node_modules/@embedded-postgres/windows-x64/native",
  );
  if (!existsSync(path.join(native, "lib/vector.dll"))) {
    if (!existsSync(path.join(extension, "lib/vector.dll")))
      throw new Error(
        "Install matching pgvector into portable PostgreSQL; see docs/SETUP.md",
      );
    await copyFile(
      path.join(extension, "lib/vector.dll"),
      path.join(native, "lib/vector.dll"),
    );
    for (const name of await readdir(path.join(extension, "share/extension")))
      await copyFile(
        path.join(extension, "share/extension", name),
        path.join(native, "share/extension", name),
      );
  }
}
const previous = existsSync(".env") ? parse(await readFile(".env")) : null;
if (previous && previous.PORTABLE_SERVICES !== "1")
  throw new Error("Refusing to overwrite a non-portable .env");
const savedPort = previous ? Number(new URL(previous.DATABASE_URL).port) : 55432;
const pgPort = Number(process.env.PULSEFIT_PG_PORT || savedPort);
if (!Number.isInteger(pgPort) || pgPort < 1024 || pgPort > 65535)
  throw new Error("PULSEFIT_PG_PORT must be an available TCP port from 1024 to 65535");
if (!previous && existsSync("work/postgres/PG_VERSION"))
  throw new Error(
    "Portable PostgreSQL exists but its private .env credentials are missing. Move work/postgres to a timestamped backup, then rerun npm run services to create a recoverable local environment.",
  );
const password = previous
  ? new URL(previous.DATABASE_URL).password
  : randomBytes(24).toString("hex");
const sessionSecret = previous?.SESSION_SECRET ?? randomBytes(32).toString("hex");
const seedPassword = previous?.SEED_PASSWORD ?? randomBytes(12).toString("hex");
const writePortableEnv = async (mongoUri = previous?.MONGODB_URI ?? "") =>
  writeFile(
    ".env",
    [
      "PORTABLE_SERVICES=1",
      `DATABASE_URL=postgresql://pulsefit:${password}@127.0.0.1:${pgPort}/pulsefit`,
      `TEST_DATABASE_URL=postgresql://pulsefit:${password}@127.0.0.1:${pgPort}/pulsefit_test`,
      `MONGODB_URI=${mongoUri}`,
      `TEST_MONGODB_URI=${mongoUri}`,
      "MONGODB_DB=pulsefit",
      "TEST_MONGODB_DB=pulsefit_test",
      `SESSION_SECRET=${sessionSecret}`,
      "APP_ORIGIN=http://localhost:3000",
      `SEED_PASSWORD=${seedPassword}`,
      "EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2",
      "EMBEDDING_CACHE=./.cache/models",
      "",
    ].join("\n"),
  );
if (!previous) await writePortableEnv();
const pg = new EmbeddedPostgres({
  databaseDir: path.resolve("work/postgres"),
  port: pgPort,
  user: "pulsefit",
  password,
  persistent: true,
  authMethod: "scram-sha-256",
  postgresFlags: ["-h", "127.0.0.1"],
  autoRehydrateSymlinks: true,
  onLog: (message) => console.log(String(message).trimEnd()),
  onError: (e) => console.error(e),
});
let mongod: MongoMemoryServer | undefined;

async function isPortOpen(port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function clearDeadPostgresLock() {
  const pidFile = path.resolve("work/postgres/postmaster.pid");
  if (!existsSync(pidFile)) return;
  const pid = (await readFile(pidFile, "utf8")).split(/\r?\n/, 1)[0];
  const listening = await isPortOpen(pgPort);
  if (listening)
    throw new Error(
      `Portable PostgreSQL is already running (PID ${pid}). Reuse it or stop that project-owned process before starting another instance.`,
    );
  await unlink(pidFile);
  console.warn("Removed stale project-local PostgreSQL lock after a confirmed stopped process.");
}

try {
  if (!existsSync("work/postgres/PG_VERSION")) {
    console.log("Initialising portable PostgreSQL...");
    await pg.initialise();
  }
  await clearDeadPostgresLock();
  if (await isPortOpen(pgPort))
    throw new Error(
      `Port ${pgPort} is already in use. Choose another project-local port, for example: $env:PULSEFIT_PG_PORT=55433; npm run services`,
    );
  console.log("Starting portable PostgreSQL...");
  try {
    await pg.start();
  } catch (error) {
    throw new Error(
      `Portable PostgreSQL failed to start: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  // PostgreSQL is deliberately bound to IPv4 loopback; avoid `localhost`,
  // which can resolve to IPv6 and wait indefinitely on Windows.
  const admin = pg.getPgClient("postgres", "127.0.0.1");
  await admin.connect();
  for (const name of ["pulsefit", "pulsefit_test"])
    if (
      !(await admin.query("SELECT 1 FROM pg_database WHERE datname=$1", [name]))
        .rowCount
    )
      await admin.query(`CREATE DATABASE "${name}"`);
  await admin.end();
  console.log(`Portable PostgreSQL ready on 127.0.0.1:${pgPort}`);
  console.log(
    "Starting portable MongoDB (the first run may download a MongoDB binary)...",
  );
  mongod = await MongoMemoryServer.create({
    instance: {
      ip: "127.0.0.1",
      port: 57017,
      dbName: "pulsefit",
      dbPath: path.resolve("work/mongo"),
    },
    binary: {
      downloadDir: path.resolve("work/mongodb-binaries"),
      ...(existsSync("work/mongodb-binaries/mongod.exe")
        ? { systemBinary: path.resolve("work/mongodb-binaries/mongod.exe") }
        : {}),
    },
  });
  await writePortableEnv(mongod.getUri());
  console.log(
    "Portable databases ready. Local-only random credentials written to ignored .env. Keep this terminal running.",
  );
  await new Promise<void>((resolve) => {
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });
} finally {
  if (mongod) await mongod.stop({ doCleanup: false });
  await pg.stop();
}
