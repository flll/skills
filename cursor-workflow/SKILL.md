---
name: cursor-workflow
description: >-
  Mandatory for all Cursor projects. Emoji-rich plans, post-plan branch decision
  and commit in Japanese (no push on app repos; active push on flll/skills only).
  Use after plan execution, implementation completion, or when deciding branch/commit workflow.
---

# cursor-workflow

全プロジェクトで Cursor を使うときの **必須ワークフロー**。秘密管理は [infra-secrets](../infra-secrets/SKILL.md) に任せる。

## Skills の読み込み（スラッシュ不要）

- Cursor は `~/.cursor/skills/<name>/SKILL.md` を **索引**（name + description）し、タスクに関連するとき **全文を読む**
- **`/skill-name` は任意**（明示したいときだけ）。会話開始だけでも description 一致で自動適用されうる
- 読込確認: `~/.cursor/skills-repo/scripts/verify-skills.sh`

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
3. **コミットメッセージは日本語**、**why 中心・1〜2 文**
4. HEREDOC で `git commit`
5. フック失敗時は **amend せず** 修正して新規 commit

### push ポリシー（二層）

| リポジトリ | push |
|------------|------|
| **作業中のアプリ等** | **NEVER**（ユーザーがそのターンで「push して」と明示するまで） |
| **flll/skills**（`~/.cursor/skills-repo`） | **積極的に** commit 後 `git push`（マルチマシン同期のため） |

アプリ repo では `git push` / push 付き `gh pr create` を実行しない。完了報告で「push はしていません」とよい。

Skills を編集したら **必ず** skills リポジトリで commit & push し、他マシンは `scripts/sync-skills.sh` で取り込む。

## ブランチ判断

| 規模 | 動作 |
|------|------|
| **小さい** | 単一 concern・数ファイル・局所修正 → **ブランチを切らない** |
| **大きい** | 機能・リファクタ・複数トピック → `future/` / `chore/` / `fix/` でブランチ作成後 commit |

- 命名: 短い kebab-case（例: `future/auth-refactor`, `chore/deps-bump`）
- ブランチ作成後、Cursor MCP の `SetActiveBranch` が使えるなら実行

## 他スキルとの関係

- 秘密・GSM・`gh auth` → **infra-secrets**
- プロジェクト固有の make / compose → **各リポジトリの README**

詳細: [reference.md](reference.md)
