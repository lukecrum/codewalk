#!/usr/bin/env node

import { execSync } from "child_process";
import { join } from "path";

const CLI_DIR = join(import.meta.dirname, "../apps/cli");

function run(cmd, options = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...options });
}

const versionType = process.argv[2] || "patch";

if (!["major", "minor", "patch"].includes(versionType)) {
  console.error("Usage: ./publish-cli.js [major|minor|patch]");
  process.exit(1);
}

// Bump version
console.log(`\nBumping ${versionType} version...`);
run(`npm version ${versionType} --no-git-tag-version`, { cwd: CLI_DIR });

// Build
console.log("\nBuilding CLI...");
run("bun run build", { cwd: CLI_DIR });

// Publish
console.log("\nPublishing to npm...");
run("npm publish", { cwd: CLI_DIR });

console.log("\nDone!");
