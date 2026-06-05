# cursor-workflow reference

## プラン用絵文字（コピペ用）

```
🎯 目的
🔧 手順 / 実装
⚠️ 注意・リスク
✅ 完了条件・テスト
📁 変更ファイル
📌 前提・依存
🚫 やらないこと
📋 チェックリスト
```

## Skills 自動読込 vs スラッシュ

| 方式 | 説明 |
|------|------|
| 自動 | エージェントが `description` とタスクを照合し、関連 Skill の `SKILL.md` を読む |
| 手動 | `/cursor-workflow` や `@cursor-workflow`（任意） |

起動時に全 Skill の **全文** が毎回入るわけではない（name + description が索引）。

## ブランチ判断フロー

```mermaid
flowchart TD
  done[Plan_or_implementation_done]
  size{Large_or_multi_topic?}
  branch[Create_branch_future_or_chore]
  commit[git_add_and_commit_ja]
  pushCheck{skills_repo?}
  pushSkills[git_push_skills]
  nopush[Never_push_app_repo]
  done --> size
  size -->|no| commit
  size -->|yes| branch --> commit
  commit --> pushCheck
  pushCheck -->|flll/skills| pushSkills
  pushCheck -->|app_repo| nopush
```

## コミットメッセージ（日本語・例）

```
Tailscale サイドカー用 compose を追加し、ホスト公開ポートを外した。

GSM から secret を読むスクリプトを追加した。

cursor-workflow に日本語コミットと skills 専用 push 方針を追記した。
```

英語メッセージは使わない（リポジトリの既存言語が英語のみのときはそのリポジトリの慣習に合わせてよいが、**ユーザー未指定時は日本語**）。

## push ポリシー

| 対象 | push |
|------|------|
| アプリ・作業リポジトリ（デフォルト） | **しない** |
| ユーザーが「push して」と明示 | する |
| **flll/skills** | **編集後は積極的に push** |

## コミット手順

```bash
git status
git diff
git log -1 --format='%s'

git add <relevant-files>
git commit -m "$(cat <<'EOF'
変更の理由を日本語で1〜2文。

EOF
)"
git status
```

## Skills 同期（flll/skills のみ push 可）

```bash
~/.cursor/skills-repo/scripts/sync-skills.sh
~/.cursor/skills-repo/scripts/verify-skills.sh
cd ~/.cursor/skills-repo && git push
```
