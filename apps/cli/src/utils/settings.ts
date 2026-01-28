import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

export interface CodewalkSettings {
  storage: 'local' | 'global';
  autoCommit: boolean;
  globalDir: string;
}

export const DEFAULT_SETTINGS: CodewalkSettings = {
  storage: 'global',
  autoCommit: true,
  globalDir: '~/.codewalk',
};

/**
 * Parse YAML frontmatter from markdown content.
 * Handles the simple key: value format used by codewalk settings.
 */
function parseYamlFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result: Record<string, unknown> = {};

  for (const line of yaml.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: string | boolean = line.slice(colonIndex + 1).trim();

    // Handle boolean values
    if (value === 'true') value = true;
    else if (value === 'false') value = false;

    result[key] = value;
  }

  return result;
}

/**
 * Expand tilde to home directory in file paths.
 */
export function expandTilde(filepath: string): string {
  if (filepath.startsWith('~/')) {
    return path.join(os.homedir(), filepath.slice(2));
  }
  if (filepath === '~') {
    return os.homedir();
  }
  return filepath;
}

/**
 * Get the repository name from git.
 */
export function getRepoName(cwd: string): string {
  try {
    const repoRoot = execSync('git rev-parse --show-toplevel', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return path.basename(repoRoot);
  } catch {
    // Fallback to current directory name
    return path.basename(cwd);
  }
}

/**
 * Load settings from .claude/codewalk.local.md.
 * Returns defaults if the file doesn't exist or is invalid.
 */
export async function loadSettings(cwd: string): Promise<CodewalkSettings> {
  const settingsPath = path.join(cwd, '.claude', 'codewalk.local.md');

  try {
    const content = await fs.readFile(settingsPath, 'utf-8');
    const parsed = parseYamlFrontmatter(content);

    if (!parsed) {
      return { ...DEFAULT_SETTINGS, globalDir: expandTilde(DEFAULT_SETTINGS.globalDir) };
    }

    return {
      storage: parsed.storage === 'global' ? 'global' : 'local',
      autoCommit: parsed.autoCommit !== false,
      globalDir: expandTilde(String(parsed.globalDir || DEFAULT_SETTINGS.globalDir)),
    };
  } catch {
    // File doesn't exist, use defaults
    return { ...DEFAULT_SETTINGS, globalDir: expandTilde(DEFAULT_SETTINGS.globalDir) };
  }
}

/**
 * Get the tracking directory based on settings.
 */
export function getTrackingDirectory(cwd: string, settings: CodewalkSettings): string {
  if (settings.storage === 'global') {
    const repoName = getRepoName(cwd);
    return path.join(settings.globalDir, repoName);
  }
  return path.join(cwd, '.codewalk');
}
