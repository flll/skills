# win32-console-hunt reference

## OpenClaw 経路

### Discord @kusanali

```
Discord → Gateway (openclaw) → cursor-bridge :18790 → @cursor/sdk Agent (local)
```

- パッチ: `services/shared/win32-spawn-hide.mjs` を cursor-bridge が先頭 import
- 設定: `config/cursor-live.json` — `discordPublicCloud: false` でローカル優先

### VC 終了・文字起こし

```
voice-archive → ffmpeg/ffprobe → STT → composer-summary → cursor-bridge (optional)
              → triggerMemoryIndex → openclaw memory index (自己再 spawn)
```

- 疑わしい import 順: `transcribe-pipeline.mjs` が `spawn-hidden.mjs` を `win32-spawn-hide` より先に import
- `spawn-hidden.mjs` は `import { spawn }` で未パッチ参照を固定する可能性（H1）

## 閾値（watchdog）

| メトリクス | ALERT | ABORT（再現中断） |
|------------|-------|-------------------|
| node.exe | >25 かつ 30s で +10 | >40 |
| conhost.exe | 10s で +3（絶対値ではなくスパイク） | 起動時 baseline から +6 |
| cmd.exe | >10 | >15 |

ABORT 時: `node ~/.openclaw/scripts/oc.mjs kill` を実行し、レポートに記録。

## 計装環境変数

| 変数 | 効果 |
|------|------|
| `OC_SPAWN_TRACE=1` | `win32-spawn-hide.mjs` / `spawn-hidden.mjs` が NDJSON ログ出力 |
| `OC_SPAWN_TRACE_PATH` | 既定 `~/.openclaw/logs/spawn-trace.ndjson` |

計装を入れたら **cursor-bridge / voice-archive を再起動**してから再現する。

## 関連ドキュメント

- OpenClaw: `~/.openclaw/docs/WINDOWS-SPAWN-HIDE.md`
- 実装: `~/.openclaw/services/shared/win32-spawn-hide.mjs`
