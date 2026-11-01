import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
if (!process.env.npm_execpath) throw new Error("Run with npm run verify");
await mkdir("docs/evidence", { recursive: true });
const results = [];
for (const script of [
  "typecheck",
  "lint",
  "test",
  "test:integration",
  "build",
]) {
  const started = new Date().toISOString();
  let output = "";
  const child = spawn(
    process.execPath,
    [process.env.npm_execpath, "run", script],
    { env: process.env, windowsHide: true },
  );
  child.stdout.on("data", (b) => {
    output += b.toString();
    process.stdout.write(b);
  });
  child.stderr.on("data", (b) => {
    output += b.toString();
    process.stderr.write(b);
  });
  const code = await new Promise<number>((resolve) => {
    child.on("error", (e) => {
      output += e.message;
      resolve(1);
    });
    child.on("exit", (n) => resolve(n ?? 1));
  });
  const file = script.replace(":", "-") + ".txt";
  await writeFile(
    "docs/evidence/" + file,
    output + "\nexit_code=" + code + "\n",
  );
  results.push({
    command: "npm run " + script,
    started,
    finished: new Date().toISOString(),
    exitCode: code,
    evidence: file,
  });
  await writeFile(
    "docs/evidence/verification.json",
    JSON.stringify(results, null, 2),
  );
  if (code !== 0) process.exit(code);
}
