#!/usr/bin/env node
/**
 * Discourse API で forum.cursor.com にトピックを投稿する。
 * Usage:
 *   node post-to-forum.mjs --title "..." --body "..." --category 6
 *   node post-to-forum.mjs --title "..." --body-file draft.md --category 22
 *   node post-to-forum.mjs --dry-run ...  (POST しない)
 *
 * Env: CURSOR_FORUM_API_KEY, CURSOR_FORUM_API_USER
 * または ~/.cursor/.env から読み込み
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const FORUM_URL = "https://forum.cursor.com/posts.json";

async function loadEnvFile() {
  const path = join(homedir(), ".cursor", ".env");
  if (!existsSync(path)) return;
  const text = await readFile(path, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  }
}

function parseArgs(argv) {
  const out = { dryRun: false, title: "", body: "", category: 6, bodyFile: "" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--title" && argv[i + 1]) out.title = argv[++i];
    else if (a === "--body" && argv[i + 1]) out.body = argv[++i];
    else if (a === "--body-file" && argv[i + 1]) out.bodyFile = argv[++i];
    else if (a === "--category" && argv[i + 1]) out.category = parseInt(argv[++i], 10);
  }
  return out;
}

async function main() {
  await loadEnvFile();
  const args = parseArgs(process.argv);

  if (args.bodyFile) {
    args.body = await readFile(args.bodyFile, "utf8");
  }

  if (!args.title || !args.body) {
    console.error("Required: --title and (--body or --body-file)");
    process.exit(1);
  }

  const apiKey = process.env.CURSOR_FORUM_API_KEY;
  const apiUser = process.env.CURSOR_FORUM_API_USER;

  const payload = {
    title: args.title,
    raw: args.body,
    category: args.category,
  };

  if (args.dryRun || !apiKey || !apiUser) {
    console.log("[post-to-forum] dry-run (missing key or --dry-run)");
    console.log(JSON.stringify({ url: FORUM_URL, headers: { "Api-Username": apiUser || "(unset)" }, payload }, null, 2));
    if (!apiKey || !apiUser) {
      console.log("\nSet CURSOR_FORUM_API_KEY and CURSOR_FORUM_API_USER in ~/.cursor/.env — see SETUP.md");
      process.exit(apiKey ? 0 : 2);
    }
    process.exit(0);
  }

  const res = await fetch(FORUM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": apiKey,
      "Api-Username": apiUser,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[post-to-forum] HTTP ${res.status}: ${text}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  const topicId = data.topic_id;
  const postId = data.id;
  const url = topicId ? `https://forum.cursor.com/t/-/${topicId}` : FORUM_URL;
  console.log(`[post-to-forum] OK topic_id=${topicId} post_id=${postId}`);
  console.log(url);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
