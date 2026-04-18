/**
 * Entry shim: `node worker.js` → `npx tsx scripts/generation-worker.ts …`
 * Examples: `node worker.js --manual --limit 1`
 */
const { spawnSync } = require("child_process");
const path = require("path");

const cwd = path.join(__dirname);
const extra = process.argv.slice(2);
const args = ["tsx", "scripts/generation-worker.ts", ...extra];

const result = spawnSync("npx", args, {
  cwd,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
