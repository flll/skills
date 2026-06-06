#!/usr/bin/env node
/**
 * Background watchdog: node/cmd/conhost counts + ALERT/ABORT thresholds.
 * Logs to ~/.openclaw/logs/spawn-watchdog.ndjson
 */
import { appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawn } from "node:child_process";

const OPENCLAW_ROOT = process.env.OPENCLAW_ROOT || join(homedir(), ".openclaw");
const LOG_DIR = join(OPENCLAW_ROOT, "logs");
const LOG_PATH = process.env.OC_SPAWN_WATCHDOG_PATH || join(LOG_DIR, "spawn-watchdog.ndjson");
const INTERVAL_MS = Number(process.env.OC_SPAWN_WATCHDOG_INTERVAL_MS) || 5000;

const THRESHOLDS = {
  node: { alert: 25, abort: 40, deltaAlert: 10, deltaWindowMs: 30_000 },
  // conhost baseline on dev PCs is often >10 (Cursor/AMD/etc.) — use delta from startup baseline
  conhost: { deltaAlert: 3, deltaAbort: 6, deltaWindowMs: 10_000 },
  cmd: { alert: 10, abort: 15, deltaAbort: 8 },
};

let baseline = null;

mkdirSync(LOG_DIR, { recursive: true });

function log(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n";
  appendFileSync(LOG_PATH, line, "utf8");
  if (entry.level === "ALERT" || entry.level === "ABORT") {
    console.error(`[spawn-watchdog] ${entry.level}: ${entry.message}`);
  }
}

function psJson(script) {
  try {
    const out = execFileSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { encoding: "utf8", windowsHide: true, timeout: 30_000 },
    );
    return JSON.parse(out.trim() || "null");
  } catch (err) {
    return { error: err.message };
  }
}

function measureProcesses() {
  const script = `
$names = @('node','cmd','conhost')
$result = @{}
foreach ($n in $names) {
  $procs = Get-Process -Name $n -ErrorAction SilentlyContinue
  $result[$n] = @{
    count = @($procs).Count
    workingSetMB = [math]::Round((@($procs | Measure-Object WorkingSet64 -Sum).Sum / 1MB), 1)
  }
}
$result | ConvertTo-Json -Compress
`;
  return psJson(script);
}

function sampleCommandLines(limit = 8) {
  const script = `
Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='cmd.exe' OR Name='conhost.exe'" |
  Select-Object -First ${limit} ProcessId, ParentProcessId, Name, CommandLine |
  ConvertTo-Json -Compress
`;
  const raw = psJson(script);
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

function runOcKill() {
  const oc = join(OPENCLAW_ROOT, "scripts", "oc.mjs");
  try {
    spawn(process.execPath, [oc, "kill"], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    }).unref();
    log({ level: "ABORT", message: "executed oc kill", action: "oc_kill" });
  } catch (err) {
    log({ level: "ABORT", message: "oc kill failed", error: err.message });
  }
}

const history = [];

function checkDelta(name, count, windowMs, deltaAlert) {
  const now = Date.now();
  history.push({ ts: now, name, count });
  const cutoff = now - windowMs;
  const relevant = history.filter((h) => h.name === name && h.ts >= cutoff);
  if (relevant.length < 2) return false;
  const oldest = relevant[0].count;
  return count - oldest >= deltaAlert;
}

let aborted = false;

function captureBaseline() {
  const m = measureProcesses();
  baseline = {
    node: m.node?.count ?? 0,
    conhost: m.conhost?.count ?? 0,
    cmd: m.cmd?.count ?? 0,
  };
  log({ level: "INFO", message: "baseline captured", baseline });
}

captureBaseline();
log({ level: "INFO", message: "spawn-watchdog started", intervalMs: INTERVAL_MS, logPath: LOG_PATH });

const timer = setInterval(() => {
  const m = measureProcesses();
  if (m.error) {
    log({ level: "WARN", message: "measure failed", error: m.error });
    return;
  }

  const node = m.node?.count ?? 0;
  const conhost = m.conhost?.count ?? 0;
  const cmd = m.cmd?.count ?? 0;
  const conhostDelta = baseline ? conhost - baseline.conhost : 0;
  const cmdDelta = baseline ? cmd - baseline.cmd : 0;

  const entry = {
    level: "METRIC",
    node,
    conhost,
    cmd,
    nodeWSMB: m.node?.workingSetMB,
    conhostWSMB: m.conhost?.workingSetMB,
    cmdWSMB: m.cmd?.workingSetMB,
  };
  log(entry);

  const alerts = [];
  if (node >= THRESHOLDS.node.abort) alerts.push(`node>=${THRESHOLDS.node.abort}`);
  if (conhostDelta >= THRESHOLDS.conhost.deltaAbort) {
    alerts.push(`conhost_delta>=${THRESHOLDS.conhost.deltaAbort}`);
  }
  if (cmd >= THRESHOLDS.cmd.abort || cmdDelta >= THRESHOLDS.cmd.deltaAbort) {
    alerts.push(`cmd_high delta=${cmdDelta}`);
  }

  if (
    node >= THRESHOLDS.node.alert &&
    checkDelta("node", node, THRESHOLDS.node.deltaWindowMs, THRESHOLDS.node.deltaAlert)
  ) {
    alerts.push("node_delta");
  }
  if (checkDelta("conhost", conhost, THRESHOLDS.conhost.deltaWindowMs, THRESHOLDS.conhost.deltaAlert)) {
    alerts.push("conhost_spike");
  }
  if (cmd >= THRESHOLDS.cmd.alert) alerts.push("cmd_alert");

  if (alerts.length) {
    const samples = sampleCommandLines();
    const isAbort = alerts.some(
      (a) =>
        a.startsWith("node>=") ||
        a.startsWith("conhost_delta>=") ||
        a.startsWith("cmd_high"),
    );
    log({
      level: isAbort ? "ABORT" : "ALERT",
      message: alerts.join(", "),
      node,
      conhost,
      cmd,
      samples,
    });
    if (isAbort && !aborted) {
      aborted = true;
      runOcKill();
    }
  }
}, INTERVAL_MS);

process.on("SIGINT", () => {
  clearInterval(timer);
  log({ level: "INFO", message: "spawn-watchdog stopped" });
  process.exit(0);
});
