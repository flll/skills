# win32-console-hunt reference

OpenClaw 経路図と既知対策ドキュメント。仮説・閾値・計装は [profile.md](profile.md)、汎用手順は [debug-hunt](../debug-hunt/SKILL.md)。

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

## 関連ドキュメント

- OpenClaw: `~/.openclaw/docs/WINDOWS-SPAWN-HIDE.md`
- 実装: `~/.openclaw/services/shared/win32-spawn-hide.mjs`
