#!/usr/bin/env node
/**
 * ログバンドル内のテキストを秘匿パターンで置換する。
 * Usage: node redact-logs.mjs <bundle-dir-or-zip>
 * zip の場合は解凍して処理し、<name>-redacted.zip を出力。
 */
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const PATTERNS = [
  [/gho_[A-Za-z0-9_]+/g, "[REDACTED_GH_TOKEN]"],
  [/ghp_[A-Za-z0-9_]+/g, "[REDACTED_GH_TOKEN]"],
  [/sk-[A-Za-z0-9_-]{10,}/g, "[REDACTED_API_KEY]"],
  [/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]"],
  [/api[_-]?key["\s:=]+[A-Za-z0-9._-]{8,}/gi, "api_key=[REDACTED]"],
  [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]"],
];

function redactText(text) {
  let out = text;
  for (const [re, rep] of PATTERNS) {
    out = out.replace(re, rep);
  }
  return out;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(p)));
    else if (/\.(log|txt|json|md)$/i.test(e.name)) files.push(p);
  }
  return files;
}

async function redactDir(dir) {
  const files = await walk(dir);
  let count = 0;
  for (const f of files) {
    const raw = await readFile(f, "utf8");
    const red = redactText(raw);
    if (red !== raw) {
      await writeFile(f, red, "utf8");
      count++;
    }
  }
  return count;
}

async function unzipToTemp(zipPath) {
  const out = join(tmpdir(), `cursor-forum-redact-${Date.now()}`);
  await mkdir(out, { recursive: true });
  // PowerShell Expand-Archive (cross-platform fallback: use powershell on win)
  if (process.platform === "win32") {
    await execFileAsync("powershell", [
      "-NoProfile",
      "-Command",
      `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${out.replace(/'/g, "''")}' -Force`,
    ], { windowsHide: true });
  } else {
    await execFileAsync("unzip", ["-o", zipPath, "-d", out]);
  }
  return out;
}

async function zipDir(dir, zipOut) {
  if (process.platform === "win32") {
    if (existsSync(zipOut)) await import("node:fs/promises").then((fs) => fs.unlink(zipOut));
    await execFileAsync("powershell", [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${dir.replace(/'/g, "''")}\\*' -DestinationPath '${zipOut.replace(/'/g, "''")}' -Force`,
    ], { windowsHide: true });
  } else {
    const base = basename(dir);
    await execFileAsync("sh", ["-c", `cd '${dirname(dir)}' && zip -r '${zipOut}' '${base}'`]);
  }
}

async function main() {
  const input = process.argv[2];
  if (!input || !existsSync(input)) {
    console.error("Usage: node redact-logs.mjs <bundle-dir-or.zip>");
    process.exit(1);
  }

  let workDir = input;
  let isZip = extname(input).toLowerCase() === ".zip";
  if (isZip) {
    workDir = await unzipToTemp(input);
  }

  const changed = await redactDir(workDir);
  console.log(`[redact-logs] redacted ${changed} file(s) in ${workDir}`);

  if (isZip) {
    const zipOut = input.replace(/\.zip$/i, "-redacted.zip");
    await zipDir(workDir, zipOut);
    console.log(`[redact-logs] wrote ${zipOut}`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
