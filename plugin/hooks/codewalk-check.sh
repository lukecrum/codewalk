#!/bin/bash

# Check for uncommitted changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo '{"decision": "block", "reason": "Uncommitted code changes detected. Run: git add -A && git commit -m \"descriptive message\", then create the codewalk tracking file at .codewalk/<hash>.json"}' >&2
  exit 2
fi

# Check if last commit has a tracking file
LAST_HASH=$(git rev-parse --short HEAD 2>/dev/null)
if [ -n "$LAST_HASH" ]; then
  # Check local storage first
  if [ ! -f ".codewalk/${LAST_HASH}.json" ]; then
    # Check global storage if configured
    if [ -f ".claude/codewalk.local.md" ]; then
      STORAGE=$(grep -E "^storage:" .claude/codewalk.local.md | awk '{print $2}' | tr -d '[:space:]')
      GLOBAL_DIR=$(grep -E "^globalDir:" .claude/codewalk.local.md | awk '{print $2}' | tr -d '[:space:]')
      GLOBAL_DIR="${GLOBAL_DIR:-$HOME/.codewalk}"
      GLOBAL_DIR="${GLOBAL_DIR/#\~/$HOME}"
      REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
      
      if [ "$STORAGE" = "global" ] && [ -f "${GLOBAL_DIR}/${REPO_NAME}/${LAST_HASH}.json" ]; then
        exit 0
      fi
    fi
    
    echo '{"decision": "block", "reason": "Missing tracking file for commit '"${LAST_HASH}"'. Create .codewalk/'"${LAST_HASH}"'.json with the codewalk schema (version, commit, author, changes array)."}' >&2
    exit 2
  fi
fi

exit 0