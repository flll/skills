#!/usr/bin/env bash
# flll/skills を取得して ~/.cursor/skills に反映
# SKILLS_SYNC_MODE=curl → git 使わない（bootstrap-skills.sh と同じ）
# デフォルト: git pull → 失敗時 curl
set -euo pipefail

SKILLS_REPO="${SKILLS_REPO:-$HOME/.cursor/skills-repo}"
SKILLS_TARGET="${CURSOR_SKILLS_DIR:-$HOME/.cursor/skills}"
GITHUB_RAW_BASE="${SKILLS_RAW_BASE:-https://raw.githubusercontent.com/flll/skills/main}"
SKILLS_SYNC_MODE="${SKILLS_SYNC_MODE:-auto}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 固定リスト（README の Skills 表と揃える）
SKILL_NAMES=(cursor-workflow git-dev-workflow debug-hunt win32-console-hunt runtime-vendor cursor-canvas-runtime atomcam-hil-loop infra-secrets)

sync_via_git() {
  mkdir -p "$(dirname "$SKILLS_REPO")"
  if [[ -d "$SKILLS_REPO/.git" ]]; then
    git -C "$SKILLS_REPO" pull --ff-only
  else
    git clone "https://github.com/flll/skills.git" "$SKILLS_REPO"
  fi
  exec "$SKILLS_REPO/scripts/link-skills.sh"
}

sync_via_curl() {
  echo "fallback: curl from ${GITHUB_RAW_BASE}"
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
        echo "ERROR: required $url not found" >&2
        exit 1
      fi
    done
    echo "installed: $dest (copy)"
  done
}

if [[ "$SKILLS_SYNC_MODE" == "curl" ]]; then
  exec "$SCRIPT_DIR/bootstrap-skills.sh"
fi

if command -v git >/dev/null 2>&1 && [[ "$SKILLS_SYNC_MODE" != "curl" ]]; then
  if [[ -d "$SKILLS_REPO/.git" ]]; then
    sync_via_git && exit 0
  fi
  if [[ "$SKILLS_SYNC_MODE" == "git" ]] || [[ "$SKILLS_SYNC_MODE" == "auto" ]]; then
    if git clone "https://github.com/flll/skills.git" "$SKILLS_REPO" 2>/dev/null; then
      sync_via_git && exit 0
    fi
  fi
fi

sync_via_curl
