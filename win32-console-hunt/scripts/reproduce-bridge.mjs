#!/usr/bin/env node
/**
 * Discord 経路の代替: cursor-bridge HTTP 直接叩き（ユーザーに Discord を試させない）
 */
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const OPENCLAW_ROOT = process.env.OPENCLAW_ROOT || join(homedir(), ".openclaw");
const BRIDGE_URL = process.env.CURSOR_BRIDGE_URL || "http://127.0.0.1:18790/v1/chat/completions";
const MODEL = process.env.REPRODUCE_BRIDGE_MODEL || "composer-2.5-public";

function loadSecrets() {
  const secretsPath = join(OPENCLAW_ROOT, "secrets.env");
  if (!existsSync(secretsPath)) return;
  for (const line of readFileSync(secretsPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (v && process.env[k] === undefined) process.env[k] = v;
  }
}

loadSecrets();

const apiKey = process.env.CURSOR_API_KEY;
if (!apiKey) {
  console.error("[reproduce-bridge] CURSOR_API_KEY missing in secrets.env");
  process.exit(1);
}

const body = {
  model: MODEL,
  messages: [
    {
      role: "user",
      content:
        process.env.REPRODUCE_BRIDGE_PROMPT ||
        "Reply with exactly one word: pong. No tools.",
    },
  ],
  stream: false,
};

console.log("[reproduce-bridge] POST", BRIDGE_URL, "model=", MODEL);

const res = await fetch(BRIDGE_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(Number(process.env.REPRODUCE_BRIDGE_TIMEOUT_MS) || 120_000),
});

const text = await res.text();
console.log("[reproduce-bridge] status", res.status);
if (!res.ok) {
  console.error(text.slice(0, 2000));
  process.exit(1);
}
try {
  const json = JSON.parse(text);
  const content = json.choices?.[0]?.message?.content;
  console.log("[reproduce-bridge] reply:", String(content || "").slice(0, 200));
} catch {
  console.log("[reproduce-bridge] raw:", text.slice(0, 500));
}
