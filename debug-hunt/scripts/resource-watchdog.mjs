#!/usr/bin/env node
/**
 * Generic profile-driven resource watchdog.
 * Usage: node resource-watchdog.mjs --profile <watchdog.json>
 */
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function expandPath(p) {
  if (!p) return p;
  return p.replace(/^~/, homedir()).replace(/\$HOME\b/g, homedir());
}

function parseArgs(argv) {
  const args = { profile: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--profile" && argv[i + 1]) {
      args.profile = resolve(argv[++i]);
    }
  }
  if (!args.profile) {
    console.error("Usage: node resource-watchdog.mjs --profile <watchdog.json>");
    process.exit(1);
  }
  return args;
}

function loadProfile(path) {
  const raw = readFileSync(path, "utf8");
  const profile = JSON.parse(raw);
  const root = process.env.DEBUG_HUNT_ROOT || join(homedir(), ".openclaw");
  const logEnv = profile.logPathEnv ? process.env[profile.logPathEnv] : null;
  const logPath = expandPath(
    logEnv || profile.logPath || join(root, "logs", "resource-watchdog.ndjson"),
  );
  const intervalMs = Number(process.env.DEBUG_HUNT_INTERVAL_MS) || profile.intervalMs || 5000;
  return { ...profile, logPath, intervalMs, profileDir: dirname(path) };
}

function runScript(spec) {
  if (!spec || spec.error) return { error: spec?.error || "no spec" };
  try {
    const type = spec.type || "powershell";
    if (type === "powershell") {
      const out = execFileSync(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", spec.script],
        { encoding: "utf8", windowsHide: true, timeout: 30_000 },
      );
      return JSON.parse(out.trim() || "null");
    }
    return { error: `unsupported script type: ${type}` };
  } catch (err) {
    return { error: err.message };
  }
}

function measure(profile) {
  return runScript(profile.measure);
}

function sampleOnAlert(profile) {
  if (!profile.sampleOnAlert) return [];
  const raw = runScript(profile.sampleOnAlert);
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

function runAbortActions(profile) {
  for (const action of profile.abortActions || []) {
    try {
      if (action.type === "spawn") {
        const cmd = expandPath(action.command);
        const args = (action.args || []).map(expandPath);
        spawn(cmd, args, {
          detached: action.detached ?? true,
          stdio: "ignore",
          windowsHide: true,
        }).unref();
        return action.label || `${cmd} ${args.join(" ")}`;
      }
      if (action.type === "exec") {
        execFileSync(expandPath(action.command), action.args || [], {
          windowsHide: true,
          timeout: 30_000,
        });
        return action.label || action.command;
      }
    } catch (err) {
      return `failed: ${err.message}`;
    }
  }
  return null;
}

function checkDelta(history, name, count, windowMs, threshold) {
  const now = Date.now();
  history.push({ ts: now, name, count });
  const cutoff = now - windowMs;
  const relevant = history.filter((h) => h.name === name && h.ts >= cutoff);
  if (relevant.length < 2) return false;
  return count - relevant[0].count >= threshold;
}

function evaluateThreshold(rule, value, baselineValue, history, name) {
  if (!rule) return null;
  const alerts = [];

  if (rule.absolute != null && value >= rule.absolute) {
    alerts.push({ kind: "absolute", threshold: rule.absolute, value });
  }
  if (rule.baselineDelta != null && baselineValue != null) {
    const delta = value - baselineValue;
    if (delta >= rule.baselineDelta) {
      alerts.push({ kind: "baselineDelta", threshold: rule.baselineDelta, delta });
    }
  }
  if (rule.delta) {
    const { windowMs, threshold } = rule.delta;
    if (checkDelta(history, name, value, windowMs, threshold)) {
      alerts.push({ kind: "delta", windowMs, threshold });
    }
  }
  return alerts.length ? alerts : null;
}

function formatAlerts(metricName, level, alerts) {
  return alerts.map((a) => {
    if (a.kind === "absolute") return `${metricName}>=${a.threshold}`;
    if (a.kind === "baselineDelta") return `${metricName}_baseline_delta>=${a.threshold}`;
    if (a.kind === "delta") return `${metricName}_delta`;
    return `${metricName}_${a.kind}`;
  });
}

const { profile: profilePath } = parseArgs(process.argv);
const profile = loadProfile(profilePath);
const history = [];
let baseline = null;
let aborted = false;

mkdirSync(dirname(profile.logPath), { recursive: true });

function log(entry) {
  const line = JSON.stringify({ ts: new Date().toISOString(), profile: profile.name, ...entry }) + "\n";
  appendFileSync(profile.logPath, line, "utf8");
  if (entry.level === "ALERT" || entry.level === "ABORT") {
    console.error(`[resource-watchdog:${profile.name}] ${entry.level}: ${entry.message}`);
  }
}

function captureBaseline(measurement) {
  baseline = {};
  for (const metric of profile.metrics || []) {
    baseline[metric.name] = measurement[metric.name]?.count ?? measurement[metric.name] ?? 0;
  }
  log({ level: "INFO", message: "baseline captured", baseline });
}

const initial = measure(profile);
if (!initial.error && profile.baselineCapture !== false) {
  captureBaseline(initial);
}

log({
  level: "INFO",
  message: "resource-watchdog started",
  intervalMs: profile.intervalMs,
  logPath: profile.logPath,
  profilePath,
});

const timer = setInterval(() => {
  const m = measure(profile);
  if (m.error) {
    log({ level: "WARN", message: "measure failed", error: m.error });
    return;
  }

  const metricEntry = { level: "METRIC" };
  for (const metric of profile.metrics || []) {
    const data = m[metric.name];
    const count = data?.count ?? data ?? 0;
    metricEntry[metric.name] = count;
    if (data?.workingSetMB != null) {
      metricEntry[`${metric.name}WSMB`] = data.workingSetMB;
    }
  }
  log(metricEntry);

  const alertMessages = [];
  const alertDetails = [];

  for (const metric of profile.metrics || []) {
    const data = m[metric.name];
    const count = data?.count ?? data ?? 0;
    const base = baseline?.[metric.name];

    const alertHits = evaluateThreshold(metric.alert, count, base, history, metric.name);
    if (alertHits) {
      alertDetails.push({ metric: metric.name, level: "alert", hits: alertHits });
      alertMessages.push(...formatAlerts(metric.name, "alert", alertHits));
    }

    const abortHits = evaluateThreshold(metric.abort, count, base, history, metric.name);
    if (abortHits) {
      alertDetails.push({ metric: metric.name, level: "abort", hits: abortHits });
      alertMessages.push(...formatAlerts(metric.name, "abort", abortHits));
    }
  }

  if (alertMessages.length) {
    const samples = sampleOnAlert(profile);
    const isAbort = alertDetails.some((d) => d.level === "abort");
    log({
      level: isAbort ? "ABORT" : "ALERT",
      message: alertMessages.join(", "),
      details: alertDetails,
      samples,
      ...Object.fromEntries(
        (profile.metrics || []).map((metric) => {
          const data = m[metric.name];
          return [metric.name, data?.count ?? data ?? 0];
        }),
      ),
    });
    if (isAbort && !aborted) {
      aborted = true;
      const action = runAbortActions(profile);
      log({ level: "ABORT", message: "abort action executed", action });
    }
  }
}, profile.intervalMs);

process.on("SIGINT", () => {
  clearInterval(timer);
  log({ level: "INFO", message: "resource-watchdog stopped" });
  process.exit(0);
});
