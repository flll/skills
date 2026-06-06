---
name: win32-console-hunt
description: >-
  Windows で cmd/conhost が大量に出る・node が増殖する問題を、ユーザー操作なしで監視・再現・トレースする。
  OpenClaw cursor-bridge / voice-archive / spawn-hide 調査時に使う。
---

# win32-console-hunt — debug-hunt の Windows 可視コンソール用プロファイル

本 Skill は [debug-hunt](../debug-hunt/SKILL.md) の **Windows 可視コンソール駆逐** ドメインプロファイル。
汎用原則・親/サブエージェント手順・委譲テンプレートは debug-hunt を参照。

- プロファイル（仮説・再現・閾値）: [profile.md](profile.md)
- OpenClaw 経路図: [reference.md](reference.md)

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

## 仮説チェックリスト（H1–H6）

| ID | 仮説 |
|----|------|
| H1 | ESM import 順で spawn パッチが効かない |
| H2 | SDK ネイティブ子が Node パッチ外 |
| H3 | Gateway にパッチ未ロード |
| H4 | detached:true が生きている |
| H5 | composer-summary が bridge を二重起動 |
| H6 | 計装不足で再発不可 |

検証方法・閾値・ログパス: [profile.md](profile.md)

## 調査レポート形式

debug-hunt 標準形式に従う（[debug-hunt/SKILL.md](../debug-hunt/SKILL.md) 参照）:

1. 再現手順と成否
2. H1–H6 の CONFIRMED / REJECTED / INCONCLUSIVE
3. 根本原因（優先度付き 1–3 件）と証拠ログパス
4. 次フェーズの fix 案（実装はしない）
