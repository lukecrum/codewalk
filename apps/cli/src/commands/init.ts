import * as fs from 'fs/promises';
import * as path from 'path';
import pc from 'picocolors';

const SKILL_TEMPLATE = `# codewalk

You are codewalk, an AI programming assistant built on top of Claude Code.

Your purpose is to give the user more visibility into the changes you are making.

The current functionality you follow is to make changes, asking for permission if needed as you go, and then you provide a brief summary of the changes made after you're done.

In addition to your normal summary, you should also keep track of what you changed in a structured file.

The purpose of the file is to walk the user through the code changes step-by-step so that they can understand the code changes you made, why you made them, and how they relate to other changes you made during that task. If the user follows up with further instructions or changes, you should update the file to track that. A full walkthrough can be found below.

User prompts are surrounded by \`<USER>\` tags, your code changes are surrounded by \`<ASSISTANT>\` tags, example tracking files are surrounded by \`<TRACK>\` tags, and notes are surrounded in \`<NOTE>\` tags.

## Tracking File Schema

\`\`\`typescript
type Changeset = {
  // Schema version for forward compatibility
  version: number;

  // Git commit SHA this changeset describes
  commit: string;

  // Who made the changes (human name, "claude", etc.)
  author: string;

  // List of logical changes, each with its own reasoning
  changes: Change[];
};

type Change = {
  // Human-readable explanation of why this change was made.
  // Should explain the intent, not just describe what changed.
  reasoning: string;

  // Files affected by this logical change
  files: FileChange[];
};

type FileChange = {
  // Path to the file, relative to repo root
  path: string;

  // Which hunks from \`git show <commit>\` belong to this change.
  // 1-indexed, in order of appearance in the diff.
  // Example: [1, 3] means the first and third hunks in this file's diff.
  hunks: number[];
};
\`\`\`

## Git Commands Reference

- Get current commit hash: \`git rev-parse --short HEAD\`
- Get commit author: \`git log -1 --format="%an"\`
- View commit diff with hunks: \`git show <commit> --format=""\`
- List files changed: \`git show <commit> --name-only --format=""\`

Hunks are numbered 1, 2, 3... in order of appearance. Each \`@@\` line in the diff starts a new hunk.

## Handling Refinements

If the user requests changes to something you just did (e.g., "use different colors", "rename that function"):

1. If it's part of the same logical task, amend the commit: \`git add -A && git commit --amend --no-edit\`
2. Update the existing tracking file to reflect the final state
3. The reasoning should describe the final result, not the iteration history

If it's a distinct new task, create a new commit and new tracking file.

## Instructions

1. Before committing, check if a git repo exists with \`git status\`. Only run \`git init\` if there isn't one.
2. After completing a task, commit your changes and automatically create a tracking file at \`.codewalk/<commit-hash>.json\`
3. Group hunks by their logical purpose—one reasoning per logical change, even if it spans multiple hunks or multiple files. If a single user request results in changes across several files, those should typically be one change with one reasoning, not separate changes per file.
4. Write reasoning that explains *why*, not just *what* (the diff already shows what)
5. If a follow-up request refines previous work, amend the commit and update the tracking file
6. If a follow-up request is a new task, create a new commit and new tracking file
7. After writing the tracking file, validate it with: \`python3 -c "import json; json.load(open('.codewalk/<commit-hash>.json'))"\`

Do not wait for the user to ask for the tracking file—create it automatically as part of finishing each task.

**Important:** Always complete the tracking step after every task, even in long conversations with multiple tasks. Do not skip this step regardless of conversation length or number of previous tasks.
`;

const CLAUDE_MD_CONTENT = `# codewalk

**CRITICAL REQUIREMENT**: You MUST create git commits for your changes AND create tracking files after EVERY task. No exceptions.

## Workflow (MANDATORY):
1. Make your code changes using Write/Edit tools
2. **COMMIT the changes**: \`git add -A && git commit -m "descriptive message"\`
3. Get the commit hash: \`git rev-parse --short HEAD\`
4. **IMMEDIATELY** create \`.codewalk/<commit-hash>.json\` with the tracking data
5. Commit the tracking file: \`git add .codewalk/<hash>.json && git commit -m "Add tracking file for <hash>"\`
6. Only THEN respond to the user

**DO NOT** skip commits. **DO NOT** respond to the user until both the code commit AND tracking file commit are done.

See \`.claude/skills/codewalk.md\` for the complete schema and examples.
`;

const SETTINGS_CONTENT = {
  hooks: {
    Stop: [
      {
        hooks: [
          {
            type: "prompt",
            prompt: "Check if the assistant made code changes in this session. If code changes were made, verify: 1) Changes were committed with git, 2) A tracking file was created at .codewalk/<commit-hash>.json, 3) The tracking file was also committed. If any of these are missing, block stopping and instruct to complete the codewalk workflow. If no code changes were made, or all steps are complete, approve stopping.",
            timeout: 30
          }
        ]
      }
    ]
  }
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export interface InitOptions {
  cwd: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const { cwd } = options;

  console.log(pc.bold('Initializing codewalk...\n'));

  // 1. Create .claude/skills directory
  const skillsDir = path.join(cwd, '.claude', 'skills');
  await fs.mkdir(skillsDir, { recursive: true });

  // 2. Create skill file (idempotent)
  const skillPath = path.join(skillsDir, 'codewalk.md');
  const skillExists = await fileExists(skillPath);

  if (!skillExists) {
    await fs.writeFile(skillPath, SKILL_TEMPLATE);
    console.log(pc.green('✓') + ' Created .claude/skills/codewalk.md');
  } else {
    console.log(pc.yellow('○') + ' .claude/skills/codewalk.md already exists, skipping');
  }

  // 3. Update CLAUDE.md (idempotent)
  const claudePath = path.join(cwd, 'CLAUDE.md');
  let claudeContent = '';

  try {
    claudeContent = await fs.readFile(claudePath, 'utf-8');
  } catch {
    // File doesn't exist, will create
  }

  if (!claudeContent.includes('.claude/skills/codewalk.md')) {
    const newContent = claudeContent
      ? claudeContent + '\n\n' + CLAUDE_MD_CONTENT
      : CLAUDE_MD_CONTENT;
    await fs.writeFile(claudePath, newContent);
    console.log(pc.green('✓') + ' Updated CLAUDE.md with codewalk instructions');
  } else {
    console.log(pc.yellow('○') + ' CLAUDE.md already references codewalk, skipping');
  }

  // 4. Create .codewalk directory
  const codewalkDir = path.join(cwd, '.codewalk');
  const codewalkExists = await fileExists(codewalkDir);
  await fs.mkdir(codewalkDir, { recursive: true });

  if (!codewalkExists) {
    console.log(pc.green('✓') + ' Created .codewalk/ directory');
  } else {
    console.log(pc.yellow('○') + ' .codewalk/ directory already exists');
  }

  // 5. Create/update settings.local.json with Stop hook
  const settingsPath = path.join(cwd, '.claude', 'settings.local.json');
  let existingSettings: Record<string, unknown> = {};

  try {
    const content = await fs.readFile(settingsPath, 'utf-8');
    existingSettings = JSON.parse(content);
  } catch {
    // File doesn't exist or is invalid, will create new
  }

  const hasStopHook = existingSettings.hooks &&
    typeof existingSettings.hooks === 'object' &&
    'Stop' in (existingSettings.hooks as Record<string, unknown>);

  if (!hasStopHook) {
    const mergedSettings = {
      ...existingSettings,
      hooks: {
        ...(existingSettings.hooks as Record<string, unknown> || {}),
        ...SETTINGS_CONTENT.hooks
      }
    };
    await fs.writeFile(settingsPath, JSON.stringify(mergedSettings, null, 2) + '\n');
    console.log(pc.green('✓') + ' Added Stop hook to .claude/settings.local.json');
  } else {
    console.log(pc.yellow('○') + ' Stop hook already configured, skipping');
  }

  console.log(pc.bold('\ncodewalk initialized successfully!'));
  console.log('\nNext steps:');
  console.log('  1. Start Claude Code in this directory');
  console.log('  2. Make changes - Claude will automatically track them');
  console.log('  3. Run ' + pc.cyan('codewalk visualize') + ' to browse changes');
}
