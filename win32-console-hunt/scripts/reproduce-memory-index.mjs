#!/usr/bin/env node
/**
 * VC memory index 経路の代替: triggerMemoryIndex() 直接呼び出し
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const OPENCLAW_ROOT = process.env.OPENCLAW_ROOT || join(homedir(), ".openclaw");
process.env.OPENCLAW_ROOT = OPENCLAW_ROOT;

const pipelinePath = join(
  OPENCLAW_ROOT,
  "services",
  "voice-archive",
  "lib",
  "transcribe-pipeline.mjs",
);

console.log("[reproduce-memory-index] importing", pipelinePath);
const { triggerMemoryIndex } = await import(pathToFileURL(pipelinePath).href);

console.log("[reproduce-memory-index] calling triggerMemoryIndex()");
triggerMemoryIndex((msg) => console.log(msg));

// Wait for child to spawn and trace logs to flush
await new Promise((r) => setTimeout(r, Number(process.env.REPRODUCE_MEMORY_WAIT_MS) || 15_000));
console.log("[reproduce-memory-index] done (waited for background spawn)");
