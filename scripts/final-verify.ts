import "dotenv/config";
import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
const directory = "docs/evidence/level3-2026-11-16";
await mkdir(directory, { recursive: true });
const npm = process.env.npm_execpath;
if (!npm) throw new Error("Use npm run verify:final -- setup|checks|http");
const phase = process.argv[2] || "checks";
const setup = [
  "db:migrate",
  "test-db:migrate",
  "db:mongo",
  "db:seed",
  "test-db:seed",
  "db:rbac",
  "db:embed",
  "test-db:embed",
];
const checks = [
  "typecheck",
  "lint",
  "test",
  "test:integration",
  "test:rbac",
  "build",
];
const commands =
  phase === "setup"
    ? setup
    : phase === "http"
      ? ["test:api", "test:smoke"]
      : checks;
const report: unknown[] = [];
for (const command of commands) {
  const isTestMigrate = command.startsWith("test-db:");
  const script = isTestMigrate ? "db:" + command.split(":")[1] : command;
  const env = { ...process.env };
  if (isTestMigrate) {
    if (
      !env.TEST_DATABASE_URL ||
      !new URL(env.TEST_DATABASE_URL).pathname.endsWith("_test")
    )
      throw new Error("Disposable test PostgreSQL URL required");
    env.DATABASE_URL = env.TEST_DATABASE_URL;
  }
  const started = new Date().toISOString();
  const child = spawn(process.execPath, [npm, "run", script], {
    env,
    windowsHide: true,
  });
  let log = "";
  child.stdout.on("data", (b) => {
    log += b;
    process.stdout.write(b);
  });
  child.stderr.on("data", (b) => {
    log += b;
    process.stderr.write(b);
  });
  const code = await new Promise<number>((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (n) => resolve(n ?? 1));
  });
  await writeFile(
    `${directory}/${command.replaceAll(":", "-")}.txt`,
    log + `\nexit_code=${code}\n`,
  );
  report.push({
    command:
      `npm run ${script}` +
      (isTestMigrate ? " (DATABASE_URL=TEST_DATABASE_URL)" : ""),
    started,
    finished: new Date().toISOString(),
    exitCode: code,
    skippedTests: /skipped [1-9]/.test(log),
  });
  await writeFile(
    `${directory}/${phase}.json`,
    JSON.stringify(report, null, 2),
  );
  if (code) process.exit(code);
  // db:rbac appends private URLs; refresh env for subsequent commands.
  if (command === "db:rbac") {
    const { parse } = await import("dotenv");
    Object.assign(process.env, parse(await readFile(".env")));
  }
}
