#!/usr/bin/env bash
# ~/.cursor/skills の各 SKILL.md が読めるか確認（値は表示しない）
set -euo pipefail

TARGET="${CURSOR_SKILLS_DIR:-$HOME/.cursor/skills}"
SKILL_NAMES=(cursor-workflow git-dev-workflow debug-hunt win32-console-hunt runtime-vendor cursor-canvas-runtime infra-secrets)
ok=0
fail=0

echo "Skills dir: $TARGET"

for name in "${SKILL_NAMES[@]}"; do
  skill_md="$TARGET/$name/SKILL.md"
  if [[ ! -f "$skill_md" ]]; then
    echo "MISSING: $name (no SKILL.md)"
    fail=$((fail + 1))
    continue
  fi
  if ! grep -q '^name:' "$skill_md" || ! grep -q '^description:' "$skill_md"; then
    echo "INVALID: $name (frontmatter incomplete)"
    fail=$((fail + 1))
    continue
  fi
  if [[ -L "$TARGET/$name" ]]; then
    echo "OK: $name (symlink -> $(readlink "$TARGET/$name"))"
  else
    echo "OK: $name (file copy)"
  fi
  ok=$((ok + 1))
done

echo "---"
echo "verified: $ok  failed: $fail"
[[ "$fail" -eq 0 ]]
