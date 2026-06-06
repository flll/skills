# win32-console-hunt profile

> 汎用手順: [debug-hunt/SKILL.md](../debug-hunt/SKILL.md)
> OpenClaw 経路図: [reference.md](reference.md)

## 症状・トリガー

- Windows で @kusanali 返信や VC 文字起こし時に cmd/conhost が大量表示
- `node.exe` / `conhost.exe` が急増して PC が操作不能になる
- `win32-spawn-hide` 適用後も再発

## 仮説表

| ID | 仮説 | 検証方法 |
|----|------|----------|
| H1 | ESM import 順で spawn パッチが効かない | spawn-trace の `spawnHidden_patched` vs `cp.spawn===patched` |
| H2 | SDK ネイティブ子が Node パッチ外 | trace に rg/sandbox があるが spawn ログに無い |
| H3 | Gateway にパッチ未ロード | Gateway 子プロセスの CommandLine に未パッチ spawn |
| H4 | detached:true が生きている | trace の `detached_after` が true |
| H5 | composer-summary が bridge を二重起動 | voice 再現時の bridge ログ |
| H6 | 計装不足で再発不可 | 本 Skill 適用後に trace が取れるか |

## 再現シナリオ

| 経路 | 代替手段 | スクリプト |
|------|----------|------------|
| Discord @kusanali | cursor-bridge 内部 HTTP | `scripts/reproduce-bridge.mjs` |
| VC 終了・文字起こし | memory index トリガ | `scripts/reproduce-memory-index.mjs` |

**原則**: ユーザーに Discord で試させない。Gateway API / 内部 HTTP のみ。

## 計装

| 変数 | 効果 | ログパス |
|------|------|----------|
| `OC_SPAWN_TRACE=1` | spawn 計装 ON | `~/.openclaw/logs/spawn-trace.ndjson` |
| `OC_SPAWN_TRACE_PATH` | ログパス上書き | 同上 |

計装追加後は **cursor-bridge / voice-archive を再起動**してから再現する。

## watchdog

- プロファイル: `profiles/win32-console.watchdog.json`
- 起動:

```powershell
node $env:USERPROFILE\.cursor\skills\debug-hunt\scripts\resource-watchdog.mjs `
  --profile $env:USERPROFILE\.cursor\skills\win32-console-hunt\profiles\win32-console.watchdog.json
```

または薄いラッパ:

```powershell
node $env:USERPROFILE\.cursor\skills\win32-console-hunt\scripts\spawn-watchdog.mjs
```

## 閾値

| メトリクス | ALERT | ABORT（再現中断） |
|------------|-------|-------------------|
| node.exe | >25 かつ 30s で +10 | >40 |
| conhost.exe | 10s で +3（スパイク） | 起動時 baseline から +6 |
| cmd.exe | >10 | >15 または baseline から +8 |

ABORT 時: `node ~/.openclaw/scripts/oc.mjs kill` を実行し、レポートに記録。

## ログ一覧

| ファイル | 内容 |
|----------|------|
| `~/.openclaw/logs/spawn-trace.ndjson` | `OC_SPAWN_TRACE=1` 時の spawn 計装 |
| `~/.openclaw/logs/spawn-watchdog.ndjson` | プロセス数監視 |
| `~/.openclaw/logs/process-snapshot-*.json` | Win32_Process スナップショット |

## スナップショット

```powershell
# ドメイン固有（プロセスツリー付き）
powershell -File $env:USERPROFILE\.cursor\skills\win32-console-hunt\scripts\snapshot-process-tree.ps1 -Label baseline

# 汎用メトリクス
powershell -File $env:USERPROFILE\.cursor\skills\debug-hunt\scripts\snapshot-metrics.ps1 `
  -Label baseline -Metrics node,cmd,conhost
```
