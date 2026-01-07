#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./commands/init");
const visualize_1 = require("./commands/visualize");
const program = new commander_1.Command();
program
    .name('codewalker')
    .description('CLI tool for visualizing AI-assisted code changes')
    .version('0.1.0');
program
    .command('init')
    .description('Initialize CodeWalker in the current project')
    .action(async () => {
    try {
        await (0, init_1.initCommand)({ cwd: process.cwd() });
    }
    catch (error) {
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
        await (0, visualize_1.visualizeCommand)({ cwd: process.cwd() });
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program.parse();
