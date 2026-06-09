#!/usr/bin/env node
/**
 * sync-<host>-runtime.template.mjs
 * Copy-paste starter for runtime-vendor Layer 2 (Sync).
 * Replace HOST_* placeholders; add vendor/ to .gitignore.
 */
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.env.PROJECT_ROOT || join(__dirname, "..", "..");
const VENDOR_DIR = join(PROJECT_ROOT, "vendor", "HOST_RUNTIME_DIR");

/** @type {string[]} */
const RUNTIME_CANDIDATES = [
  process.env.HOST_RUNTIME_PATH,
  // Windows example:
  join(process.env.LOCALAPPDATA || "", "Programs", "HOST_APP", "resources", "app", "PATH", "TO", "runtime.esm.js"),
  // macOS example:
  // "/Applications/HOST_APP.app/Contents/Resources/app/PATH/TO/runtime.esm.js",
].filter(Boolean);

/** Re-export patch targets — fill from host .d.ts or profile.md */
const EXPORT_NAMES = [
  "ExampleComponent",
  "useExampleHook",
];

function resolveRuntimePath() {
  for (const candidate of RUNTIME_CANDIDATES) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  throw new Error(
    "HOST runtime not found. Install host product or set HOST_RUNTIME_PATH.",
  );
}

function copyTypes() {
  const srcTypes = join(process.env.LOCALAPPDATA || "", "Programs", "HOST_APP", "resources", "app", "PATH", "TO", "types");
  const destTypes = join(VENDOR_DIR, "types");
  if (!existsSync(srcTypes)) {
    throw new Error(`Host types not found: ${srcTypes}`);
  }
  mkdirSync(destTypes, { recursive: true });
  for (const name of readdirSync(srcTypes)) {
    if (name.endsWith(".d.ts")) {
      cpSync(join(srcTypes, name), join(destTypes, name));
    }
  }
  const versionSrc = join(dirname(srcTypes), "HOST-sdk-version");
  if (existsSync(versionSrc)) {
    cpSync(versionSrc, join(VENDOR_DIR, "HOST-sdk-version"));
  }
}

function patchRuntime(sourcePath) {
  let source = readFileSync(sourcePath, "utf8");

  // Optional: extend final export{...} block — pattern depends on host bundle format.
  const exportMatch = source.match(/export\{[^}]+\};$/);
  if (!exportMatch) {
    throw new Error("Unexpected runtime format: final export block not found");
  }

  const names = EXPORT_NAMES.join(",");
  const extended = exportMatch[0].replace(/\};$/, `,${names}};`);
  source = source.replace(exportMatch[0], extended);

  writeFileSync(join(VENDOR_DIR, "runtime.esm.js"), source);

  const license = sourcePath.replace(/\.js$/, ".js.LICENSE.txt");
  if (existsSync(license)) {
    cpSync(license, join(VENDOR_DIR, "runtime.esm.js.LICENSE.txt"));
  }

  writeFileSync(
    join(VENDOR_DIR, "exports.json"),
    JSON.stringify({ exports: EXPORT_NAMES, patchedAt: new Date().toISOString() }, null, 2) + "\n",
  );
}

function main() {
  const runtimePath = resolveRuntimePath();
  mkdirSync(VENDOR_DIR, { recursive: true });
  copyTypes();
  patchRuntime(runtimePath);
  const versionPath = join(VENDOR_DIR, "HOST-sdk-version");
  const version = existsSync(versionPath) ? readFileSync(versionPath, "utf8").trim() : "unknown";
  console.log(`Synced HOST runtime → ${VENDOR_DIR}`);
  console.log(`HOST-sdk-version: ${version}`);
  console.log(`Re-exported ${EXPORT_NAMES.length} symbols`);
}

main();
