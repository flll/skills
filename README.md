# flll/skills

Private Cursor Agent Skills。複数プロジェクト共通。プロジェクト固有の手順は各リポジトリに置く。

## Setup

```bash
gh auth login
git clone https://github.com/flll/skills.git ~/.cursor/skills-repo
~/.cursor/skills-repo/scripts/link-skills.sh
```

## Update

```bash
cd ~/.cursor/skills-repo && git pull && ./scripts/link-skills.sh
```

## Layout

```
<skill-name>/
  SKILL.md      # required
  reference.md  # optional deep detail
scripts/
  link-skills.sh
```

`~/.cursor/skills/<skill-name>` → symlink into this repo.

## Rules

- No secrets in git. No project-specific compose/Makefile docs here.
- Edit skills here; commit & push. Do not duplicate skills inside application repos.
