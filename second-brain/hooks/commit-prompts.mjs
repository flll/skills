#!/usr/bin/env node
/**
 * sessionEnd フック: ~/brain/prompts/ の変更を commit + push(ユーザー承認済みの自動同期)。
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const BRAIN = process.env.BRAIN_DIR || join(homedir(), "brain");

async function git(args) {
  return execFileAsync("git", args, { cwd: BRAIN, windowsHide: true });
}

async function main() {
  if (!existsSync(BRAIN)) {
    process.stdout.write("{}");
    return;
  }

  try {
    const { stdout: status } = await git(["status", "--porcelain", "prompts/"]);
    if (!status.trim()) {
      process.stdout.write("{}");
      return;
    }

    await git(["add", "prompts/"]);
    await git(["commit", "-m", "prompts: セッション終了時の自動同期"]);
    await git(["push"]);
  } catch {
    // fail-open
  }
  process.stdout.write("{}");
}

main().catch(() => {
  process.stdout.write("{}");
  process.exit(0);
});
