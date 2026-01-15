# codewalk

Install the codewalk plugin for automatic tracking of AI-assisted code changes:

```
claude plugin install codewalk
```

Once installed, the plugin will automatically:
- Create git commits for code changes
- Generate `.codewalk/<hash>.json` tracking files with structured reasoning
- Enforce the workflow via a Stop hook

See the plugin documentation for configuration options.
