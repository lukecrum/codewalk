import * as fs from 'fs';
import * as path from 'path';

export interface FileWatcherOptions {
  trackingDir: string;
  gitHeadPath: string;
  repoRoot: string;
  onTrackingChange: () => void;
  onBranchChange: () => void;
  pollIntervalMs?: number;
}

/**
 * Robust file watcher with separate debounce timers and polling fallback.
 * Handles long-running sessions where fs.watch() may silently fail.
 */
export class FileWatcher {
  private trackingWatcher: fs.FSWatcher | null = null;
  private branchWatcher: fs.FSWatcher | null = null;
  private trackingDebounceTimer: NodeJS.Timeout | null = null;
  private branchDebounceTimer: NodeJS.Timeout | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private destroyed = false;

  private lastBranchContent: string | null = null;
  private lastTrackingFiles: Set<string> = new Set();

  private readonly trackingDir: string;
  private readonly gitHeadPath: string;
  private readonly repoRoot: string;
  private readonly onTrackingChange: () => void;
  private readonly onBranchChange: () => void;
  private readonly pollIntervalMs: number;

  constructor(options: FileWatcherOptions) {
    this.trackingDir = options.trackingDir;
    this.gitHeadPath = options.gitHeadPath;
    this.repoRoot = options.repoRoot;
    this.onTrackingChange = options.onTrackingChange;
    this.onBranchChange = options.onBranchChange;
    this.pollIntervalMs = options.pollIntervalMs ?? 10000;

    this.initializeState();
    this.startWatchers();
    this.startPolling();
  }

  /**
   * Initialize state for polling comparisons
   */
  private initializeState(): void {
    try {
      this.lastBranchContent = fs.readFileSync(this.gitHeadPath, 'utf-8');
    } catch {
      this.lastBranchContent = null;
    }

    try {
      const files = fs.readdirSync(this.trackingDir);
      this.lastTrackingFiles = new Set(files.filter(f => f.endsWith('.json')));
    } catch {
      this.lastTrackingFiles = new Set();
    }
  }

  /**
   * Start file system watchers
   */
  private startWatchers(): void {
    this.startTrackingWatcher();
    this.startBranchWatcher();
  }

  /**
   * Start watching the tracking directory
   */
  private startTrackingWatcher(): void {
    if (this.destroyed) return;

    try {
      // Ensure directory exists
      fs.mkdirSync(this.trackingDir, { recursive: true });

      this.trackingWatcher = fs.watch(this.trackingDir, (eventType, filename) => {
        if (filename && filename.endsWith('.json')) {
          this.scheduleTrackingChange();
        }
      });

      this.trackingWatcher.on('error', () => {
        this.restartTrackingWatcher();
      });
    } catch {
      // Will rely on polling fallback
    }
  }

  /**
   * Start watching .git/HEAD for branch changes
   */
  private startBranchWatcher(): void {
    if (this.destroyed) return;

    try {
      this.branchWatcher = fs.watch(this.gitHeadPath, () => {
        this.scheduleBranchChange();
      });

      this.branchWatcher.on('error', () => {
        this.restartBranchWatcher();
      });
    } catch {
      // Will rely on polling fallback
    }
  }

  /**
   * Restart tracking watcher after error
   */
  private restartTrackingWatcher(): void {
    if (this.destroyed) return;

    if (this.trackingWatcher) {
      try {
        this.trackingWatcher.close();
      } catch {
        // Ignore close errors
      }
      this.trackingWatcher = null;
    }

    // Delay restart to avoid rapid restart loops
    setTimeout(() => {
      if (!this.destroyed) {
        this.startTrackingWatcher();
      }
    }, 1000);
  }

  /**
   * Restart branch watcher after error
   */
  private restartBranchWatcher(): void {
    if (this.destroyed) return;

    if (this.branchWatcher) {
      try {
        this.branchWatcher.close();
      } catch {
        // Ignore close errors
      }
      this.branchWatcher = null;
    }

    // Delay restart to avoid rapid restart loops
    setTimeout(() => {
      if (!this.destroyed) {
        this.startBranchWatcher();
      }
    }, 1000);
  }

  /**
   * Schedule tracking change callback with debounce
   */
  private scheduleTrackingChange(): void {
    if (this.trackingDebounceTimer) {
      clearTimeout(this.trackingDebounceTimer);
    }
    this.trackingDebounceTimer = setTimeout(() => {
      this.trackingDebounceTimer = null;
      this.onTrackingChange();
    }, 100);
  }

  /**
   * Schedule branch change callback with debounce
   */
  private scheduleBranchChange(): void {
    if (this.branchDebounceTimer) {
      clearTimeout(this.branchDebounceTimer);
    }
    this.branchDebounceTimer = setTimeout(() => {
      this.branchDebounceTimer = null;
      this.onBranchChange();
    }, 100);
  }

  /**
   * Start periodic polling as fallback for missed events
   */
  private startPolling(): void {
    this.pollTimer = setInterval(() => {
      this.poll();
    }, this.pollIntervalMs);
  }

  /**
   * Poll for changes that watchers may have missed
   */
  private poll(): void {
    if (this.destroyed) return;

    // Check for branch changes
    try {
      const currentBranchContent = fs.readFileSync(this.gitHeadPath, 'utf-8');
      if (currentBranchContent !== this.lastBranchContent) {
        this.lastBranchContent = currentBranchContent;
        this.scheduleBranchChange();
      }
    } catch {
      // Ignore read errors during polling
    }

    // Check for tracking file changes
    try {
      const files = fs.readdirSync(this.trackingDir);
      const currentFiles = new Set(files.filter(f => f.endsWith('.json')));

      // Check if files were added or removed
      const hasChanges =
        currentFiles.size !== this.lastTrackingFiles.size ||
        [...currentFiles].some(f => !this.lastTrackingFiles.has(f));

      if (hasChanges) {
        this.lastTrackingFiles = currentFiles;
        this.scheduleTrackingChange();
      }
    } catch {
      // Ignore read errors during polling
    }
  }

  /**
   * Clean up all watchers and timers
   */
  destroy(): void {
    this.destroyed = true;

    if (this.trackingWatcher) {
      try {
        this.trackingWatcher.close();
      } catch {
        // Ignore close errors
      }
      this.trackingWatcher = null;
    }

    if (this.branchWatcher) {
      try {
        this.branchWatcher.close();
      } catch {
        // Ignore close errors
      }
      this.branchWatcher = null;
    }

    if (this.trackingDebounceTimer) {
      clearTimeout(this.trackingDebounceTimer);
      this.trackingDebounceTimer = null;
    }

    if (this.branchDebounceTimer) {
      clearTimeout(this.branchDebounceTimer);
      this.branchDebounceTimer = null;
    }

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
