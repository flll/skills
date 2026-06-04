#!/usr/bin/env bash
# flll/skills → ~/.cursor/skills へ各スキルを symlink
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${CURSOR_SKILLS_DIR:-$HOME/.cursor/skills}"

mkdir -p "$TARGET"

for skill_dir in "$REPO_ROOT"/*/; do
  name="$(basename "$skill_dir")"
  case "$name" in
    scripts|.git) continue ;;
  esac
  test -f "${skill_dir}SKILL.md" || continue
  rm -rf "$TARGET/$name"
  ln -sfn "$skill_dir" "$TARGET/$name"
  echo "linked: $TARGET/$name -> $skill_dir"
done
