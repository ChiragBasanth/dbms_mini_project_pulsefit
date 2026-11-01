import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import {
  mkdir,
  writeFile,
  copyFile,
  readdir,
  readFile,
} from "node:fs/promises";
import { parse } from "dotenv";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { MongoMemoryServer } from "mongodb-memory-server";
// Optional portable development runtimes. No system service installation.
await mkdir("work", { recursive: true });
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
const password = previous
  ? new URL(previous.DATABASE_URL).password
  : randomBytes(24).toString("hex");
const pg = new EmbeddedPostgres({
  databaseDir: path.resolve("work/postgres"),
  port: 55432,
  user: "pulsefit",
  password,
  persistent: true,
  authMethod: "scram-sha-256",
  postgresFlags: ["-h", "127.0.0.1"],
  onLog: () => {},
  onError: (e) => console.error(e),
});
let mongod: MongoMemoryServer | undefined;
try {
  if (!existsSync("work/postgres/PG_VERSION")) await pg.initialise();
  await pg.start();
  const admin = pg.getPgClient();
  await admin.connect();
  for (const name of ["pulsefit", "pulsefit_test"])
    if (
      !(await admin.query("SELECT 1 FROM pg_database WHERE datname=$1", [name]))
        .rowCount
    )
      await pg.createDatabase(name);
  await admin.end();
  console.log("Portable PostgreSQL ready on 127.0.0.1:55432");
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
  if (!previous)
    await writeFile(
      ".env",
      [
        "PORTABLE_SERVICES=1",
        `DATABASE_URL=postgresql://pulsefit:${password}@127.0.0.1:55432/pulsefit`,
        `TEST_DATABASE_URL=postgresql://pulsefit:${password}@127.0.0.1:55432/pulsefit_test`,
        `MONGODB_URI=${mongod.getUri()}`,
        `TEST_MONGODB_URI=${mongod.getUri()}`,
        "MONGODB_DB=pulsefit",
        "TEST_MONGODB_DB=pulsefit_test",
        `SESSION_SECRET=${randomBytes(32).toString("hex")}`,
        "APP_ORIGIN=http://localhost:3000",
        `SEED_PASSWORD=${randomBytes(12).toString("hex")}`,
        "EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2",
        "EMBEDDING_CACHE=./.cache/models",
        "",
      ].join("\n"),
      { flag: "wx" },
    );
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
