#!/usr/bin/env bash
# ~/.cursor/skills の各 SKILL.md が読めるか確認（値は表示しない）
set -euo pipefail

TARGET="${CURSOR_SKILLS_DIR:-$HOME/.cursor/skills}"
BRAIN_DIR="${BRAIN_DIR:-$HOME/brain}"
SKILL_NAMES=(cursor-workflow git-dev-workflow debug-hunt win32-console-hunt runtime-vendor cursor-canvas-runtime atomcam-hil-loop infra-secrets second-brain ai-coach cursor-forum-feedback)
ok=0
fail=0
warn=0

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
if [[ -d "$BRAIN_DIR" && -f "$BRAIN_DIR/PROFILE.md" && -f "$BRAIN_DIR/INDEX.md" ]]; then
  echo "OK: brain data dir ($BRAIN_DIR)"
else
  echo "WARN: brain not found or incomplete — clone: gh repo clone flll/brain $BRAIN_DIR"
  warn=$((warn + 1))
fi

echo "---"
echo "verified: $ok  failed: $fail  warnings: $warn"
[[ "$fail" -eq 0 ]]
