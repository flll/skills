/**
 * exports-introspect.template.mjs
 * Layer 3 (Introspect) — verify vendor runtime exports match exports.json.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VENDOR_RUNTIME = join(__dirname, "..", "vendor", "HOST_RUNTIME_DIR", "runtime.esm.js");
const EXPORTS_JSON = join(__dirname, "..", "vendor", "HOST_RUNTIME_DIR", "exports.json");

/**
 * @param {string[]} names
 */
export async function verifyRuntimeExports(names) {
  if (!existsSync(VENDOR_RUNTIME)) {
    throw new Error("vendor runtime missing — run sync script first");
  }

  const mod = await import(pathToFileURL(VENDOR_RUNTIME).href);
  const missing = [];
  for (const name of names) {
    if (!(name in mod)) missing.push(name);
  }
  if (missing.length > 0) {
    throw new Error(`runtime missing exports: ${missing.join(", ")}`);
  }
  return mod;
}

export function readExportsManifest() {
  if (!existsSync(EXPORTS_JSON)) return null;
  return JSON.parse(readFileSync(EXPORTS_JSON, "utf8"));
}

/** CLI: node exports-introspect.template.mjs */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const manifest = readExportsManifest();
  if (!manifest?.exports?.length) {
    console.error("exports.json missing or empty");
    process.exit(1);
  }
  verifyRuntimeExports(manifest.exports)
    .then(() => {
      console.log(`OK: ${manifest.exports.length} exports verified`);
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
