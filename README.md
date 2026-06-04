# flll/skills

Cursor Agent Skills（private）。Bananacraft など複数プロジェクトで共有する。

## 初回（各マシン）

```bash
git clone git@github.com:flll/skills.git ~/.cursor/skills-repo
~/.cursor/skills-repo/scripts/link-skills.sh
```

または Bananacraft リポジトリから:

```bash
make skills-sync
```

## 日常

```bash
cd ~/.cursor/skills-repo && git pull
~/.cursor/skills-repo/scripts/link-skills.sh
```

編集後は commit & push:

```bash
git add -A && git commit -m "..." && git push
```

## レイアウト

リポジトリ直下にスキル名のディレクトリを置く（Cursor の Project/Personal Skills と同じ形）:

```
infra-accounts/
  SKILL.md
  reference.md
```

## 配置先

| 種類 | パス | 説明 |
|------|------|------|
| 正本（git） | `~/.cursor/skills-repo` | このリポジトリの clone |
| Cursor が読む | `~/.cursor/skills/<name>/` | `link-skills.sh` がシンボリックリンクを張る |

秘密（`secret.env` / `~/.cursor/.env`）は **このリポジトリに含めない**。
