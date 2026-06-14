#!/usr/bin/env node
/**
 * beforeSubmitPrompt フック: ユーザーが Cursor に送ったプロンプトを ~/brain/prompts/ に追記。
 * stdin: Cursor hooks JSON。stdout: {} (送信を止めない)。
 */
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BRAIN = process.env.BRAIN_DIR || join(homedir(), "brain");
const PROMPTS_DIR = join(BRAIN, "prompts");
const DEBUG_ONCE = join(PROMPTS_DIR, "_schema-once.json");

function extractPrompt(input) {
  if (!input || typeof input !== "object") return null;
  const candidates = [
    input.prompt,
    input.user_message,
    input.userMessage,
    input.text,
    input.message,
    input.content,
    input.input,
    input.data?.prompt,
    input.data?.user_message,
    input.data?.text,
    input.payload?.prompt,
    input.payload?.text,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  for (const v of Object.values(input)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const nested = extractPrompt(v);
      if (nested) return nested;
    }
  }
  return null;
}

async function main() {
  const raw = await new Promise((res, rej) => {
    let buf = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (buf += c));
    process.stdin.on("end", () => res(buf));
    process.stdin.on("error", rej);
  });

  let input = {};
  try {
    input = raw ? JSON.parse(raw) : {};
  } catch {
    input = { _parseError: true, _raw: raw?.slice(0, 2000) };
  }

  if (!existsSync(BRAIN)) {
    process.stdout.write("{}");
    return;
  }

  await mkdir(PROMPTS_DIR, { recursive: true });

  if (!existsSync(DEBUG_ONCE)) {
    await writeFile(DEBUG_ONCE, JSON.stringify({ keys: Object.keys(input), sample: input }, null, 2), "utf8");
  }

  const prompt = extractPrompt(input);
  if (!prompt) {
    process.stdout.write("{}");
    return;
  }

  const now = new Date();
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const file = join(PROMPTS_DIR, `${day}.jsonl`);
  const entry = {
    ts: now.toISOString(),
    prompt,
    cwd: process.cwd(),
    hook: "beforeSubmitPrompt",
  };
  await appendFile(file, JSON.stringify(entry) + "\n", "utf8");
  process.stdout.write("{}");
}

main().catch(() => {
  process.stdout.write("{}");
  process.exit(0);
});
