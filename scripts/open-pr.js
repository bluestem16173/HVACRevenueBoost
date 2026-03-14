#!/usr/bin/env node
/**
 * Opens GitHub PR creation page for current branch vs main.
 * Run before leaving: npm run pr
 */
const { execSync } = require("child_process");

const branch = execSync("git branch --show-current", { encoding: "utf8" }).trim();
const url = `https://github.com/bluestem16173/HVACRevenueBoost/compare/main...${encodeURIComponent(branch)}`;

const opener = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
execSync(`${opener} "${url}"`, { stdio: "inherit" });
console.log(`Opened PR: ${branch} → main`);
