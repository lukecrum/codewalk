#!/usr/bin/env bun
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { visualizeCommand } from './commands/visualize.js';

const program = new Command();

program
  .name('codewalker')
  .description('CLI tool for visualizing AI-assisted code changes')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize CodeWalker in the current project')
  .action(async () => {
    try {
      await initCommand({ cwd: process.cwd() });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('visualize')
  .alias('viz')
  .description('Open TUI to visualize tracked changes on the current branch')
  .action(async () => {
    try {
      await visualizeCommand({ cwd: process.cwd() });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
