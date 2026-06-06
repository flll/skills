#!/usr/bin/env node
/**
 * Thin wrapper: win32-console watchdog profile → debug-hunt resource-watchdog.
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const profile = join(__dirname, "..", "profiles", "win32-console.watchdog.json");
const watchdog = join(__dirname, "..", "..", "debug-hunt", "scripts", "resource-watchdog.mjs");

const child = spawn(process.execPath, [watchdog, "--profile", profile], {
  stdio: "inherit",
  windowsHide: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

process.on("SIGINT", () => child.kill("SIGINT"));
