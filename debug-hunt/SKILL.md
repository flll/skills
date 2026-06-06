---
name: debug-hunt
description: >-
  レア・再発困難なバグを、ユーザー操作なしで監視・再現・トレースする汎用調査フレーム。
  親エージェントが計装と watchdog を用意し、readonly サブエージェントに能動再現と仮説検証を委譲する。
  プロセス増殖・ハング・環境依存の不具合調査時に使う。
---

# debug-hunt — レアバグ調査フレームワーク

汎用の **親 / サブエージェント二層** 調査パターン。ドメイン固有の仮説・再現手順は各プロファイル Skill（例: [win32-console-hunt](../win32-console-hunt/SKILL.md)）の `profile.md` に置く。

## 必須原則

| 原則 | 内容 |
|------|------|
| ユーザーに本番再現させない | 代替 HTTP / CLI / 内部 API でエージェントが再現 |
| 能動実行 | 監視・再現・ログ採取はエージェントが行う |
| 安全装置 | baseline 相対の watchdog、閾値超過で再現中断 + クリーンアップ提案 |
| 調査と fix 分離 | 調査フェーズでは `fix:` コミット禁止。fix はユーザー承認後 |
| 再帰ループ | 仮説 → 計装 → 再現 → ログ相関 → 仮説更新（最大 5 ラウンド） |

詳細仕様: [reference.md](reference.md)

## 親エージェント手順

1. **プラン作成** — 仮説表・計装箇所・再現シナリオ・成果物を列挙
2. **ドメインプロファイル確認** — 対象 Skill の `profile.md` を全文読む
3. **計装追加** — 環境変数フラグ、NDJSON ログ、本番デフォルト OFF
4. **watchdog 起動** — `resource-watchdog.mjs --profile <watchdog.json>` を `run_in_background` で起動
5. **readonly サブエージェント委譲** — [templates/subagent-prompt.md](templates/subagent-prompt.md) を埋めて Task ツールで起動
6. **レポート提示** — サブエージェント出力をユーザーに提示（fix は含めない）

## サブエージェント委譲

[templates/subagent-prompt.md](templates/subagent-prompt.md) をコピーし、以下を埋める:

- `subagent_type`: `generalPurpose` または `explore`
- `readonly`: `true`
- Skill / profile の絶対パス
- 仮説 ID リスト
- ログパス・スナップショット出力先

## スクリプト

| スクリプト | 用途 |
|------------|------|
| `scripts/resource-watchdog.mjs` | プロファイル JSON 駆動のメトリクス監視 |
| `scripts/snapshot-metrics.ps1` | 任意メトリクスのスナップショット（Windows） |

```powershell
# watchdog 起動例
node $env:USERPROFILE\.cursor\skills\debug-hunt\scripts\resource-watchdog.mjs `
  --profile $env:USERPROFILE\.cursor\skills\win32-console-hunt\profiles\win32-console.watchdog.json

# メトリクススナップショット例
powershell -File $env:USERPROFILE\.cursor\skills\debug-hunt\scripts\snapshot-metrics.ps1 `
  -Label baseline -Metrics node,cmd,conhost
```

## 新ドメイン追加

1. [templates/profile.template.md](templates/profile.template.md) をコピー → `<domain>-hunt/profile.md`
2. 仮説・再現手段・watchdog メトリクス・ログパスを記入
3. 必要なら `scripts/reproduce-*.mjs` をドメイン Skill に追加
4. `SKILL.md` の description にトリガー語を書く
5. プランは CreatePlan + 本 Skill 手順に従う

プロジェクト固有の計装は **アプリリポジトリ**、手順・サブエージェント運用は **flll/skills** に置く。

## 調査レポート形式

1. 再現手順と成否
2. 仮説判定表（CONFIRMED / REJECTED / INCONCLUSIVE）
3. 根本原因 1–3 件 + 証拠ログパス
4. 次フェーズ fix 案（実装しない）
