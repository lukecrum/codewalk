#!/bin/bash

# Check for uncommitted changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo '{"decision": "block", "reason": "Uncommitted code changes detected. Run: git add -A && git commit -m \"descriptive message\", then create the codewalk tracking file."}' >&2
  exit 2
fi

# Check if last commit has a tracking file
LAST_HASH=$(git rev-parse --short HEAD 2>/dev/null)
if [ -n "$LAST_HASH" ]; then
  # Read config if exists, otherwise use defaults
  STORAGE="global"
  GLOBAL_DIR="$HOME/.codewalk"

  if [ -f ".claude/codewalk.local.md" ]; then
    CONFIG_STORAGE=$(grep -E "^storage:" .claude/codewalk.local.md | awk '{print $2}' | tr -d '[:space:]')
    CONFIG_GLOBAL_DIR=$(grep -E "^globalDir:" .claude/codewalk.local.md | awk '{print $2}' | tr -d '[:space:]')
    [ -n "$CONFIG_STORAGE" ] && STORAGE="$CONFIG_STORAGE"
    [ -n "$CONFIG_GLOBAL_DIR" ] && GLOBAL_DIR="${CONFIG_GLOBAL_DIR/#\~/$HOME}"
  fi

  REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")

  # Check the appropriate location based on storage mode
  if [ "$STORAGE" = "global" ]; then
    if [ ! -f "${GLOBAL_DIR}/${REPO_NAME}/${LAST_HASH}.json" ]; then
      echo '{"decision": "block", "reason": "Missing tracking file for commit '"${LAST_HASH}"'. Create '"${GLOBAL_DIR}/${REPO_NAME}/${LAST_HASH}"'.json with the codewalk schema."}' >&2
      exit 2
    fi
  else
    if [ ! -f ".codewalk/${LAST_HASH}.json" ]; then
      echo '{"decision": "block", "reason": "Missing tracking file for commit '"${LAST_HASH}"'. Create .codewalk/'"${LAST_HASH}"'.json with the codewalk schema."}' >&2
      exit 2
    fi
  fi
fi

exit 0
