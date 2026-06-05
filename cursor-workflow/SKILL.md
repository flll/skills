---
name: cursor-workflow
description: >-
  Mandatory for all Cursor projects. Emoji-rich plans, post-plan branch decision
  and commit (no push unless user explicitly asks). Use after plan execution,
  implementation completion, or when deciding branch/commit workflow.
---

# cursor-workflow

全プロジェクトで Cursor を使うときの **必須ワークフロー**。秘密管理は [infra-secrets](../infra-secrets/SKILL.md) に任せる。

## プラン作成時（絵文字）

プラン・要約・CreatePlan 出力の **主要セクション見出し** に絵文字を付けて読みやすくする。

| セクション | 絵文字例 |
|------------|----------|
| 目的・ゴール | 🎯 |
| 手順・実装 | 🔧 |
| 注意・リスク | ⚠️ |
| 完了条件・テスト | ✅ |
| ファイル・構成 | 📁 |
| 依存・前提 | 📌 |

- コードブロック・パス・コマンドはそのまま。絵文字は見出し・区切り中心（装飾過多にしない）。
- 一覧は [reference.md](reference.md)。

## プラン遂行後（git）

ユーザーが「コミットして」と言わなくても、**プラン遂行や実装でファイル変更が残ったら** コミットまで行う。

1. 並列で確認: `git status` / `git diff` / `git log -1`
2. 関連ファイルのみ `git add`（`.env`・秘密・無関係ファイルは除外）
3. **why 中心・1〜2 文**のコミットメッセージを考える
4. HEREDOC で `git commit`
5. フック失敗時は **amend せず** 修正して新規 commit

### push は厳禁

**NEVER** `git push` する（作業対象リポジトリに限る）。ユーザーが **そのターンで明示** しない限り:

- `git push` / `git push -u` を実行しない
- push 付きの `gh pr create` 等でリモートへ反映しない

完了報告で「push はしていません」と一言してよい。

**例外**: ユーザーが「push して」「リモートに上げて」と **明示したターンのみ** push 可。

## ブランチ判断

| 規模 | 動作 |
|------|------|
| **小さい** | 単一 concern・数ファイル・局所修正 → **ブランチを切らない**（現在ブランチのまま commit） |
| **大きい** | 機能・リファクタ・複数トピック・後でまとめたい → ブランチ作成してから commit |

| プレフィックス | 用途 |
|----------------|------|
| `future/<topic>` | 機能・リファクタ・複数コミットにまたがる作業 |
| `chore/<topic>` | 設定・依存・ドキュメント・メンテ |
| `fix/<topic>` | バグ修正（必要時） |

- 命名: 短い kebab-case（例: `future/auth-refactor`, `chore/deps-bump`）
- ブランチ作成後、Cursor MCP の `SetActiveBranch` が使えるなら実行

## 他スキルとの関係

- 秘密・GSM・`gh auth` → **infra-secrets**
- プロジェクト固有の make / compose / デプロイ → **各リポジトリの README**

詳細: [reference.md](reference.md)
