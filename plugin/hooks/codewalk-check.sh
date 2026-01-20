#!/bin/bash

# Codewalk Stop Hook - Session-Aware
# Only enforces tracking when THIS session wrote/deleted code

# Parse stdin JSON for transcript_path
STDIN_JSON=$(cat)
TRANSCRIPT_PATH=$(echo "$STDIN_JSON" | grep -o '"transcript_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"transcript_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")

# If no transcript path, fall back to full checks (conservative)
RUN_CHECKS=false
if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
  RUN_CHECKS=true
else
  # Check for compaction marker - if compacted, can't trust transcript completeness
  COMPACTED=$(grep -c '"subtype".*"compact_boundary"' "$TRANSCRIPT_PATH" 2>/dev/null || echo 0)

  # Check for code-modifying tool calls (Write, Edit)
  WROTE_CODE=$(grep -cE '"tool":\s*"(Write|Edit)"' "$TRANSCRIPT_PATH" 2>/dev/null || echo 0)

  # Check for file deletion via Bash (rm or git rm)
  DELETED=$(grep -E '"tool":\s*"Bash"' "$TRANSCRIPT_PATH" 2>/dev/null | grep -cE '(rm |git rm)' || echo 0)

  if [ "$COMPACTED" -gt 0 ]; then
    # Compaction happened - can't trust transcript, run full checks
    RUN_CHECKS=true
  elif [ "$WROTE_CODE" -gt 0 ] || [ "$DELETED" -gt 0 ]; then
    # Detected code changes in transcript
    RUN_CHECKS=true
  fi
fi

# If no code changes detected in this session, allow stop
if [ "$RUN_CHECKS" = false ]; then
  exit 0
fi

# Check for uncommitted changes (before any other checks)
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo '{"decision": "block", "reason": "Uncommitted code changes detected. Invoke the /codewalk skill to commit and create the tracking file."}'
  exit 2
fi

# Skip merge commits (they have a second parent)
if git rev-parse --verify HEAD^2 &>/dev/null; then
  exit 0
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
      echo '{"decision": "block", "reason": "Missing tracking file for commit '"${LAST_HASH}"'. Invoke the /codewalk skill to create the tracking file."}'
      exit 2
    fi
  else
    if [ ! -f ".codewalk/${LAST_HASH}.json" ]; then
      echo '{"decision": "block", "reason": "Missing tracking file for commit '"${LAST_HASH}"'. Invoke the /codewalk skill to create the tracking file."}'
      exit 2
    fi
  fi
fi

exit 0
