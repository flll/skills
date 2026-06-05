#!/usr/bin/env bash
# git clone なしで flll/skills を ~/.cursor/skills に配置（curl のみ）
# 用法: bootstrap-skills.sh  または  curl -fsSL .../bootstrap-skills.sh | bash
set -euo pipefail

SKILLS_TARGET="${CURSOR_SKILLS_DIR:-$HOME/.cursor/skills}"
GITHUB_RAW_BASE="${SKILLS_RAW_BASE:-https://raw.githubusercontent.com/flll/skills/main}"
SKILL_NAMES=(cursor-workflow infra-secrets)

mkdir -p "$SKILLS_TARGET"

for name in "${SKILL_NAMES[@]}"; do
  dest="$SKILLS_TARGET/$name"
  rm -rf "$dest"
  mkdir -p "$dest"
  for file in SKILL.md reference.md; do
    url="${GITHUB_RAW_BASE}/${name}/${file}"
    if curl -fsSL "$url" -o "$dest/$file" 2>/dev/null; then
      echo "fetched: $url"
    elif [[ "$file" == "reference.md" ]]; then
      rm -f "$dest/$file"
    else
      echo "ERROR: $url" >&2
      exit 1
    fi
  done
  echo "installed: $dest"
done

# scripts を置く（verify / 今後の sync 用）
SCRIPTS_DIR="${HOME}/.cursor/skills-repo/scripts"
mkdir -p "$SCRIPTS_DIR"
for script in verify-skills.sh sync-skills.sh link-skills.sh bootstrap-skills.sh; do
  curl -fsSL "${GITHUB_RAW_BASE}/scripts/${script}" -o "${SCRIPTS_DIR}/${script}" 2>/dev/null || true
  chmod +x "${SCRIPTS_DIR}/${script}" 2>/dev/null || true
done

echo "bootstrap done: $SKILLS_TARGET"
