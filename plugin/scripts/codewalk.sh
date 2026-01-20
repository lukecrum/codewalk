#!/bin/bash
# Codewalk - Unified entry point for all codewalk operations
# Usage: codewalk.sh <subcommand> [options]

set -e

# ============================================================================
# Configuration
# ============================================================================

load_config() {
    # Defaults
    STORAGE="global"
    GLOBAL_DIR="$HOME/.codewalk"

    # Read config if exists
    if [ -f ".claude/codewalk.local.md" ]; then
        CONFIG_STORAGE=$(grep -E "^storage:" .claude/codewalk.local.md 2>/dev/null | awk '{print $2}' | tr -d '[:space:]')
        CONFIG_GLOBAL_DIR=$(grep -E "^globalDir:" .claude/codewalk.local.md 2>/dev/null | awk '{print $2}' | tr -d '[:space:]')
        [ -n "$CONFIG_STORAGE" ] && STORAGE="$CONFIG_STORAGE"
        [ -n "$CONFIG_GLOBAL_DIR" ] && GLOBAL_DIR="${CONFIG_GLOBAL_DIR/#\~/$HOME}"
    fi

    REPO_NAME=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")
}

# ============================================================================
# JSON Validation
# ============================================================================

validate_json() {
    local file="$1"

    # Try jq first (most thorough)
    if command -v jq &>/dev/null; then
        if jq empty < "$file" 2>/dev/null; then
            return 0
        fi
        echo "JSON validation failed (jq)" >&2
        return 1
    fi

    # Try python3/python as fallback
    if command -v python3 &>/dev/null; then
        if python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
            return 0
        fi
        echo "JSON validation failed (python3)" >&2
        return 1
    fi

    if command -v python &>/dev/null; then
        if python -c "import json; json.load(open('$file'))" 2>/dev/null; then
            return 0
        fi
        echo "JSON validation failed (python)" >&2
        return 1
    fi

    # Pure bash fallback: basic structural check
    local content
    content=$(cat "$file")

    # Check for balanced braces and brackets
    local open_braces close_braces open_brackets close_brackets
    open_braces=$(echo "$content" | tr -cd '{' | wc -c)
    close_braces=$(echo "$content" | tr -cd '}' | wc -c)
    open_brackets=$(echo "$content" | tr -cd '[' | wc -c)
    close_brackets=$(echo "$content" | tr -cd ']' | wc -c)

    if [ "$open_braces" -ne "$close_braces" ]; then
        echo "JSON validation failed: unbalanced braces" >&2
        return 1
    fi

    if [ "$open_brackets" -ne "$close_brackets" ]; then
        echo "JSON validation failed: unbalanced brackets" >&2
        return 1
    fi

    # Basic structure check - must start with { or [
    if ! echo "$content" | grep -qE '^\s*[\[{]'; then
        echo "JSON validation failed: must start with { or [" >&2
        return 1
    fi

    return 0
}

validate_json_string() {
    local json_string="$1"

    # Try jq first
    if command -v jq &>/dev/null; then
        if echo "$json_string" | jq empty 2>/dev/null; then
            return 0
        fi
        echo "JSON validation failed (jq)" >&2
        return 1
    fi

    # Try python3/python as fallback
    if command -v python3 &>/dev/null; then
        if echo "$json_string" | python3 -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
            return 0
        fi
        echo "JSON validation failed (python3)" >&2
        return 1
    fi

    if command -v python &>/dev/null; then
        if echo "$json_string" | python -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
            return 0
        fi
        echo "JSON validation failed (python)" >&2
        return 1
    fi

    # Basic structural check
    local open_braces close_braces open_brackets close_brackets
    open_braces=$(echo "$json_string" | tr -cd '{' | wc -c)
    close_braces=$(echo "$json_string" | tr -cd '}' | wc -c)
    open_brackets=$(echo "$json_string" | tr -cd '[' | wc -c)
    close_brackets=$(echo "$json_string" | tr -cd ']' | wc -c)

    if [ "$open_braces" -ne "$close_braces" ] || [ "$open_brackets" -ne "$close_brackets" ]; then
        echo "JSON validation failed: unbalanced braces/brackets" >&2
        return 1
    fi

    return 0
}

# ============================================================================
# Path Resolution
# ============================================================================

get_tracking_path() {
    local hash="$1"
    load_config

    if [ "$STORAGE" = "global" ]; then
        echo "${GLOBAL_DIR}/${REPO_NAME}/${hash}.json"
    else
        echo ".codewalk/${hash}.json"
    fi
}

# ============================================================================
# Subcommands
# ============================================================================

cmd_status() {
    git status
}

cmd_commit() {
    local message=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -m|--message)
                message="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    if [ -z "$message" ]; then
        echo "Error: commit message required (-m)" >&2
        exit 1
    fi

    git add -A && git commit -m "$message"
}

cmd_amend() {
    git add -A && git commit --amend --no-edit
}

cmd_hash() {
    git rev-parse --short HEAD
}

cmd_show() {
    local commit="${1:-HEAD}"
    git show "$commit" --format=""
}

cmd_write_tracking() {
    local hash="$1"

    if [ -z "$hash" ]; then
        echo "Error: commit hash required" >&2
        exit 1
    fi

    # Read JSON from stdin
    local json_content
    json_content=$(cat)

    if [ -z "$json_content" ]; then
        echo "Error: JSON content required via stdin" >&2
        exit 1
    fi

    # Validate JSON before writing
    if ! validate_json_string "$json_content"; then
        echo "Error: Invalid JSON content" >&2
        exit 1
    fi

    load_config
    local tracking_path
    tracking_path=$(get_tracking_path "$hash")

    # Create directory if needed
    local tracking_dir
    tracking_dir=$(dirname "$tracking_path")
    mkdir -p "$tracking_dir"

    # Write the file
    echo "$json_content" > "$tracking_path"

    echo "Tracking file created: $tracking_path"
}

cmd_read_tracking() {
    local hash="$1"

    if [ -z "$hash" ]; then
        echo "Error: commit hash required" >&2
        exit 1
    fi

    load_config
    local tracking_path
    tracking_path=$(get_tracking_path "$hash")

    if [ ! -f "$tracking_path" ]; then
        echo "Error: Tracking file not found: $tracking_path" >&2
        exit 1
    fi

    cat "$tracking_path"
}

cmd_validate_json() {
    local file="$1"

    if [ -z "$file" ]; then
        echo "Error: file path required" >&2
        exit 1
    fi

    if [ ! -f "$file" ]; then
        echo "Error: File not found: $file" >&2
        exit 1
    fi

    if validate_json "$file"; then
        echo "JSON is valid"
        exit 0
    else
        exit 1
    fi
}

cmd_tracking_path() {
    local hash="$1"

    if [ -z "$hash" ]; then
        echo "Error: commit hash required" >&2
        exit 1
    fi

    get_tracking_path "$hash"
}

cmd_config() {
    load_config
    echo "storage: $STORAGE"
    echo "globalDir: $GLOBAL_DIR"
    echo "repoName: $REPO_NAME"

    local hash
    hash=$(git rev-parse --short HEAD 2>/dev/null || echo "none")
    echo "currentHash: $hash"
    echo "trackingPath: $(get_tracking_path "$hash")"
}

cmd_help() {
    cat << 'EOF'
codewalk.sh - Unified entry point for codewalk operations

USAGE:
    codewalk.sh <subcommand> [options]

SUBCOMMANDS:
    status              Git status check
    commit -m "msg"     Stage and commit all changes
    amend               Amend the last commit (add staged changes)
    hash                Get current commit hash (short)
    show [commit]       Show commit diff (default: HEAD)
    write-tracking <hash>   Write tracking JSON (reads from stdin)
    read-tracking <hash>    Read existing tracking file
    validate-json <file>    Validate a JSON file
    tracking-path <hash>    Get the tracking file path for a commit
    config              Show current configuration
    help                Show this help message

EXAMPLES:
    # Commit changes
    codewalk.sh commit -m "Add new feature"

    # Get commit hash
    codewalk.sh hash

    # Write tracking file
    echo '{"commit":"abc1234","changes":[]}' | codewalk.sh write-tracking abc1234

    # Check tracking path
    codewalk.sh tracking-path abc1234

EOF
}

# ============================================================================
# Main
# ============================================================================

main() {
    local subcommand="${1:-help}"
    shift 2>/dev/null || true

    case "$subcommand" in
        status)
            cmd_status
            ;;
        commit)
            cmd_commit "$@"
            ;;
        amend)
            cmd_amend
            ;;
        hash)
            cmd_hash
            ;;
        show)
            cmd_show "$@"
            ;;
        write-tracking)
            cmd_write_tracking "$@"
            ;;
        read-tracking)
            cmd_read_tracking "$@"
            ;;
        validate-json)
            cmd_validate_json "$@"
            ;;
        tracking-path)
            cmd_tracking_path "$@"
            ;;
        config)
            cmd_config
            ;;
        help|--help|-h)
            cmd_help
            ;;
        *)
            echo "Unknown subcommand: $subcommand" >&2
            echo "Run 'codewalk.sh help' for usage information" >&2
            exit 1
            ;;
    esac
}

main "$@"
