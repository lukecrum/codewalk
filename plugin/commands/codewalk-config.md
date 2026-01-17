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
  - label: "Local (Recommended)"
    description: "Store in .codewalk/ directory within your project. Can be committed to git."
  - label: "Global"
    description: "Store in ~/.codewalk/ outside the repo. Never committed, personal tracking only."

**Question 2 - Auto-commit (for local storage):**
- header: "Auto-commit"
- question: "Should tracking files be auto-committed after code commits?"
- multiSelect: false
- options:
  - label: "Yes (Recommended)"
    description: "Automatically commit tracking files in a separate commit after each code commit."
  - label: "No"
    description: "Create tracking files but leave them untracked. You commit them manually if desired."

**Question 3 - Global directory (for global storage):**
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
- answers["0"]: Storage mode ("Local (Recommended)" or "Global")
- answers["1"]: Auto-commit ("Yes (Recommended)" or "No")
- answers["2"]: Global directory ("~/.codewalk (Recommended)" or "Custom path")

Determine final settings:
- If storage is "Local (Recommended)": set `storage: local`
- If storage is "Global": set `storage: global`
- If auto-commit is "Yes (Recommended)": set `autoCommit: true`
- If auto-commit is "No": set `autoCommit: false`
- If global directory is "~/.codewalk (Recommended)": set `globalDir: ~/.codewalk`
- If global directory is "Custom path": The user will have provided the path as custom text

## Step 4: Handle Custom Path

If the user selected "Custom path" or provided custom text for the global directory question, use that value for `globalDir`.

## Step 5: Create Settings File

Ensure the `.claude/` directory exists, then use the Write tool to create `.claude/codewalk.local.md`:

```markdown
---
storage: <local or global>
autoCommit: <true or false>
globalDir: <path, default ~/.codewalk>
---

# Codewalk Configuration

This file configures codewalk for this project.

## Current Settings

- **Storage**: <local or global>
  - local: Tracking files in `.codewalk/` directory
  - global: Tracking files in `<globalDir>/<repo-name>/`

- **Auto-commit**: <true or false>
  - Only applies to local storage
  - When true, tracking files are committed automatically

- **Global Directory**: <path>
  - Only applies to global storage
  - Where tracking files are stored outside the repo

## Changing Settings

Edit the YAML frontmatter above and restart Claude Code for changes to take effect.
```

## Step 6: Confirm to User

Tell the user:
1. Settings file created/updated at `.claude/codewalk.local.md`
2. Summary of the configuration:
   - Storage mode and what it means
   - Auto-commit setting (if local)
   - Global directory (if global)
3. Note that `.local.md` files are typically gitignored (personal settings)
4. Settings take effect immediately for new codewalk operations
