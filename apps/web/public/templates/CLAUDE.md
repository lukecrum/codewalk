# codewalk

**CRITICAL REQUIREMENT**: You MUST create git commits for your changes AND create tracking files after EVERY task. No exceptions.

## Workflow (MANDATORY):
1. Make your code changes using Write/Edit tools
2. **COMMIT the changes**: `git add -A && git commit -m "descriptive message"`
3. Get the commit hash: `git rev-parse --short HEAD`
4. **IMMEDIATELY** create `.codewalk/<commit-hash>.json` with the tracking data
5. Commit the tracking file: `git add .codewalk/<hash>.json && git commit -m "Add tracking file for <hash>"`
6. Only THEN respond to the user

**DO NOT** skip commits. **DO NOT** respond to the user until both the code commit AND tracking file commit are done.

See `.claude/skills/codewalk.md` for the complete schema and examples.
