---
description: Configure codewalk settings interactively
allowed-tools: [AskUserQuestion, Read, Write]
---

# Configure Codewalk Settings

This command helps you configure codewalk settings for this project.

## Step 1: Check Existing Settings

First, check if `.claude/codewalk.local.md` already exists using the Read tool. If it exists, parse the current settings to show as context.

If settings exist, tell the user their current configuration before asking questions.

## Step 2: Gather Configuration

Use AskUserQuestion to ask about settings. Ask all questions in a single call:

**Question 1 - Storage Mode:**
- header: "Storage"
- question: "Where should codewalk store tracking files?"
- multiSelect: false
- options:
  - label: "Global (Recommended)"
    description: "Store in ~/.codewalk/ outside the repo. Never committed, personal tracking only."
  - label: "Local"
    description: "Store in .codewalk/ directory within your project. Left untracked."

**Question 2 - Global directory:**
- header: "Directory"
- question: "Where should global tracking files be stored?"
- multiSelect: false
- options:
  - label: "~/.codewalk (Recommended)"
    description: "Default location in your home directory."
  - label: "Custom path"
    description: "Specify a custom directory path."

## Step 3: Process Answers

Parse the answers:
- answers["0"]: Storage mode ("Global (Recommended)" or "Local")
- answers["1"]: Global directory ("~/.codewalk (Recommended)" or "Custom path")

Determine final settings:
- If storage is "Global (Recommended)": set `storage: global`
- If storage is "Local": set `storage: local`
- If global directory is "~/.codewalk (Recommended)": set `globalDir: ~/.codewalk`
- If global directory is "Custom path": The user will have provided the path as custom text

## Step 4: Handle Custom Path

If the user selected "Custom path" or provided custom text for the global directory question, use that value for `globalDir`.

## Step 5: Create Settings File

Ensure the `.claude/` directory exists, then use the Write tool to create `.claude/codewalk.local.md`:

```markdown
---
storage: <global or local>
globalDir: <path, default ~/.codewalk>
---

# Codewalk Configuration

This file configures codewalk for this project.

## Current Settings

- **Storage**: <global or local>
  - global: Tracking files in `<globalDir>/<repo-name>/`
  - local: Tracking files in `.codewalk/` directory (untracked)

- **Global Directory**: <path>
  - Where tracking files are stored outside the repo
  - Only applies when storage is global

## Changing Settings

Edit the YAML frontmatter above and restart Claude Code for changes to take effect.
```

## Step 6: Confirm to User

Tell the user:
1. Settings file created/updated at `.claude/codewalk.local.md`
2. Summary of the configuration:
   - Storage mode and what it means
   - Global directory path
3. Note that `.local.md` files are typically gitignored (personal settings)
4. Settings take effect immediately for new codewalk operations
