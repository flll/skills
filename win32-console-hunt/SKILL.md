---
name: win32-console-hunt
description: >-
  Windows で cmd/conhost が大量に出る・node が増殖する問題を、ユーザー操作なしで監視・再現・トレースする。
  OpenClaw cursor-bridge / voice-archive / spawn-hide 調査時に使う。
---

# win32-console-hunt — Windows 可視コンソール駆逐

## 必須原則

- **ユーザーに Discord で試させない** — 再現は `reproduce-bridge.mjs` / Gateway API / 内部 HTTP のみ
- **原因特定までユーザー操作を要求しない** — 監視・再現・ログ採取はエージェントが能動実行
- **安全装置**: watchdog が `node.exe` / `conhost.exe` / `cmd.exe` が閾値超過（node>40, conhost>8, cmd>15）で **再現を中断**し `oc kill` 相当を実行
- **修正は別フェーズ** — 本 Skill は情報収集・仮説検証まで。`fix:` コミットはユーザー確認後
- **再帰的手順**: 仮説 → 計装 → 再現 → ログ相関 → 子プロセスツリー → 仮説更新（最大 5 ラウンド）

## いつ読むか

- Windows で @kusanali 返信や VC 文字起こし時に cmd/conhost が大量表示
- `node.exe` / `conhost.exe` が急増して PC が操作不能になる
- `win32-spawn-hide` 適用後も再発

詳細: [reference.md](reference.md)

## クイックスタート

```powershell
# 1. 計装 ON（調査セッションのみ）
$env:OC_SPAWN_TRACE = "1"

# 2. 監視（バックグラウンド）
node $env:USERPROFILE\.cursor\skills\win32-console-hunt\scripts\spawn-watchdog.mjs

# 3. サービス確認・未起動なら起動（ユーザーに依頼しない）
cd $env:USERPROFILE\.openclaw
node scripts/oc.mjs status
# 必要なら: node scripts/oc.mjs up

# 4. ベースライン
powershell -File $env:USERPROFILE\.cursor\skills\win32-console-hunt\scripts\snapshot-process-tree.ps1 -Label baseline

# 5. Discord 経路の代替再現
node $env:USERPROFILE\.cursor\skills\win32-console-hunt\scripts\reproduce-bridge.mjs

# 6. VC memory index 経路の代替再現
node $env:USERPROFILE\.cursor\skills\win32-console-hunt\scripts\reproduce-memory-index.mjs

# 7. 事後スナップショット + ログ分析
powershell -File $env:USERPROFILE\.cursor\skills\win32-console-hunt\scripts\snapshot-process-tree.ps1 -Label after
```

## ログ

| ファイル | 内容 |
|----------|------|
| `~/.openclaw/logs/spawn-trace.ndjson` | `OC_SPAWN_TRACE=1` 時の spawn 計装 |
| `~/.openclaw/logs/spawn-watchdog.ndjson` | プロセス数監視 |
| `~/.openclaw/logs/process-snapshot-*.json` | Win32_Process スナップショット |

## 仮説チェックリスト

| ID | 仮説 | 検証方法 |
|----|------|----------|
| H1 | ESM import 順で spawn パッチが効かない | spawn-trace の `spawnHidden_patched` vs `cp.spawn===patched` |
| H2 | SDK ネイティブ子が Node パッチ外 | trace に rg/sandbox があるが spawn ログに無い |
| H3 | Gateway にパッチ未ロード | Gateway 子プロセスの CommandLine に未パッチ spawn |
| H4 | detached:true が生きている | trace の `detached_after` が true |
| H5 | composer-summary が bridge を二重起動 | voice 再現時の bridge ログ |
| H6 | 計装不足で再発不可 | 本 Skill 適用後に trace が取れるか |

## 調査レポート形式

1. 再現手順と成否
2. H1–H6 の CONFIRMED / REJECTED / INCONCLUSIVE
3. 根本原因（優先度付き 1–3 件）と証拠ログパス
4. 次フェーズの fix 案（実装はしない）
