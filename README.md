# flll/skills

Cursor Agent Skills（private）。

**前提**: `gh auth login`（`GITHUB_TOKEN` は secret.env に載せない）

## 初回

```bash
gh auth login
cd /path/to/Bananacraft && make skills-sync
```

## 日常

```bash
cd ~/.cursor/skills-repo && git pull && ./scripts/link-skills.sh
```

編集後: `git commit && git push`
