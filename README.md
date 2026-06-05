# flll/skills

Public Cursor Agent Skills。複数プロジェクト共通。プロジェクト固有の手順は各リポジトリに置く。

## Skills

| Skill | 用途 |
|-------|------|
| **cursor-workflow** | **必須** — プラン（絵文字）、遂行後のブランチ・**日本語** commit、アプリは push 禁止 |
| infra-secrets | 秘密・GSM・gh 認証（全プロジェクト） |

## Skills の読み込み方（スラッシュ不要）

1. Cursor が `~/.cursor/skills/<name>/SKILL.md` を登録する
2. 各 Skill の **description** を見て、タスクに関連するとき **全文を読む**
3. `/skill-name` や `@skill` は **任意**（明示呼び出し用）

会話を始めるだけで、関連 Skill はエージェントが選んで適用しうる（全文が毎回すべて入るわけではない）。

## Cursor 初期設定（1 回）

**[SETUP.md](SETUP.md)** を参照。

- 基盤 URL: `https://github.com/flll/skills`
- Settings の **Remote Rule (GitHub)** は **使わない**（`.mdc` 専用で SKILL.md 非対応）
- **User Rules** に正本 URL と「不足時は bootstrap を実行」を 1 行書く（推奨）
- **git clone はユーザー不要** — エージェントが `bootstrap-skills.sh` / `sync-skills.sh` を実行

```bash
# 手動で試す場合のみ
curl -fsSL https://raw.githubusercontent.com/flll/skills/main/scripts/bootstrap-skills.sh | bash
~/.cursor/skills-repo/scripts/verify-skills.sh
```

## Update（同期）

```bash
~/.cursor/skills-repo/scripts/sync-skills.sh
```

優先順位:

1. `git pull` + `link-skills.sh`（clone 済み）
2. 未 clone → `git clone`（Public・HTTPS）
3. git 不可 → **raw URL** から curl（ログイン不要）

raw 例: `https://raw.githubusercontent.com/flll/skills/main/cursor-workflow/SKILL.md`

## 編集後（skills リポジトリだけ push）

```bash
cd ~/.cursor/skills-repo
git add -A
git commit -m "変更内容を日本語で"
git push
```

作業中のアプリリポジトリへの push は cursor-workflow の禁止ルールに従う。

## Layout

```
<skill-name>/
  SKILL.md
  reference.md
scripts/
  link-skills.sh
  sync-skills.sh
  verify-skills.sh
```

`~/.cursor/skills/<skill-name>` → symlink または curl コピー。

## Rules

- No secrets in git.
- Edit skills here only; do not duplicate inside application repos.
