---
name: cursor-workflow
description: >-
  Mandatory for all Cursor projects. Emoji-rich plans, post-plan branch decision
  and commit in Japanese. ONLY flll/skills may be pushed/synced proactively by the
  agent; NEVER push any other repo unless the user explicitly asks in that turn
  (user may git commit --amend). Use after plan execution or branch/commit workflow.
---

# cursor-workflow

全プロジェクトで Cursor を使うときの **必須ワークフロー**。秘密管理は [infra-secrets](../infra-secrets/SKILL.md) に任せる。

## Skills の読み込み（スラッシュ不要）

- 正本 URL: **https://github.com/flll/skills**（Settings の Remote Rule GitHub は SKILL.md 非対応なので使わない）
- Cursor は `~/.cursor/skills/<name>/SKILL.md` を **索引**し、タスクに関連するとき **全文を読む**
- **`/skill-name` は任意**。会話開始だけでも description 一致で自動適用されうる

### 初回・不足時（エージェントが自動実行）

ユーザーに **git clone を頼めない**。`verify-skills.sh` が失敗したら、作業前に **聞かず** 同期する:

```bash
~/.cursor/skills-repo/scripts/verify-skills.sh || \
  ~/.cursor/skills-repo/scripts/bootstrap-skills.sh
# bootstrap が無い場合（新マシン）:
curl -fsSL https://raw.githubusercontent.com/flll/skills/main/scripts/bootstrap-skills.sh | bash
~/.cursor/skills-repo/scripts/verify-skills.sh
```

`SKILLS_SYNC_MODE=curl` なら git を使わない。初回設定は [SETUP.md](https://github.com/flll/skills/blob/main/SETUP.md)。

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

### push ポリシー（厳守・二層）

**原則**: エージェントが `git push` してよいのは **flll/skills だけ**。それ以外は **ユーザーがそのターンで明示するまで絶対に push しない**。

| リポジトリ | エージェントの push | 理由 |
|------------|---------------------|------|
| **flll/skills**（`~/.cursor/skills-repo`） | **積極的に OK** — 編集後は commit → `git push` → 必要なら `sync-skills.sh` | マルチマシンで skills を正本同期するため。能動的 push が意味を持つ |
| **skills 以外のすべて**（アプリ、OpenClaw、dotfiles 等） | **NEVER** | ユーザーは `git commit --amend` や履歴整理を自分のタイミングで行う。エージェントの push は不具合・競合の原因になる |

**skills 以外で禁止する操作**（明示指示がない限り）:

- `git push`（`--force` 含む一切）
- `git push -u origin …`
- `gh pr create` の前段としての push（PR 作成自体もユーザー明示時のみ）
- 「念のため」「完了したので」などの理由での先回り push

**skills で必須の流れ**（編集したら聞かず実行）:

```bash
cd ~/.cursor/skills-repo
git add -A
git commit -m "変更理由を日本語で"
git push
~/.cursor/skills-repo/scripts/sync-skills.sh   # ローカル ~/.cursor/skills へ反映
~/.cursor/skills-repo/scripts/verify-skills.sh
```

**アプリ repo の完了報告**: コミットまで行った場合は「**push はしていません**（ご指定のタイミングでお願いします）」と明示する。push を促しすぎない。

## ブランチ判断

**ブランチ戦略は [git-dev-workflow](../git-dev-workflow/SKILL.md) に従う。** 新規プロジェクト・方針未確定時は **AskQuestion で init 質問してから** branch を切る／切らないを決める。エージェントが独断で決めない。

init 済みで `trunk-main` のときの目安:

| 規模 | 動作 |
|------|------|
| **小さい** | main 直コミット（ブランチを切らない） |
| **大きい** | 原則 main 直（コミットを分割）。下記「モジュール化コミット」を能動実行。不確実な実験のみ `experiment/<名前>` |

`short-feature` / `long-feature` 選択時は git-dev-workflow の該当節を参照。

- 命名: 短い kebab-case（例: `fix/win32-spawn-hide`, `experiment/br-bump`）
- ブランチ作成後、Cursor MCP の `SetActiveBranch` が使えるなら実行

## モジュール化コミット（複数トピック時は能動実行）

ユーザーが「コミットして」と言わなくても、**2 つ以上の concern** や **広い diff** が残ったら単一コミットにまとめない。

1. `chore/split-<topic>` で作業し、**依存順**に小さな日本語コミット（`fix` → `refactor` → `feat` → `config` → `docs`）
2. 同一ファイルに複数 concern → `git add -p`
3. 秘密・ランタイム生成・無関係コピー（例: `skills/` ローカル鏡像、`media/inbound/`）は除外
4. `main` から **機能別ブランチ候補** を切り、各コミットを **cherry-pick** で鮮明化:
   - `fix/…` `feat/…` `config/…` + 統合確認用 `chore/split-…`
5. 完了報告にコミット SHA 一覧とブランチ候補を載せる。**push は skills 以外しない**

プロジェクトに `.cursor/rules/git-modular-commits.mdc` があればそちらの除外パス・命名を優先する。

## 他スキルとの関係

- ブランチ戦略・init 質問 → **git-dev-workflow**（本スキルより優先）
- 秘密・GSM・`gh auth` → **infra-secrets**
- プロジェクト固有の make / compose → **各リポジトリの README**

詳細: [reference.md](reference.md)
