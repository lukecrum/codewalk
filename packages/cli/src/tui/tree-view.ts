import {
  BoxRenderable,
  TextRenderable,
  ScrollBoxRenderable,
  DiffRenderable,
  type CliRenderer,
} from '@opentui/core';
import type { AppState } from './app.js';
import type { ParsedHunk } from '../utils/git.js';

// Convert hunks to unified diff format for DiffRenderable
function hunksToUnifiedDiff(filePath: string, hunks: ParsedHunk[]): string {
  let diff = `--- a/${filePath}\n+++ b/${filePath}\n`;
  for (const hunk of hunks) {
    diff += hunk.header + '\n';
    diff += hunk.content;
  }
  return diff;
}

// Get file extension for syntax highlighting
function getFileType(filePath: string): string | undefined {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const typeMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
  };
  return ext ? typeMap[ext] : undefined;
}

interface SelectableItem {
  type: 'reasoning' | 'file';
  reasoningIdx: number;
  filePath?: string;
}

interface SelectableItemWithRenderable extends SelectableItem {
  renderable: BoxRenderable;
  contentTop?: number; // Track position in scroll content
}

export class TreeView {
  private renderer: CliRenderer;
  private state: AppState;
  private rootBox: BoxRenderable;
  private headerBox: BoxRenderable;
  private stickyHeaderBox: BoxRenderable;
  private scrollBox: ScrollBoxRenderable;
  private footerBox: BoxRenderable;
  private selectableItems: SelectableItem[] = [];
  private itemRenderables: SelectableItemWithRenderable[] = [];
  private reasoningPositions: Map<number, { top: number; bottom: number }> = new Map();

  constructor(renderer: CliRenderer, state: AppState) {
    this.renderer = renderer;
    this.state = state;

    // Root container - full screen, vertical flex
    this.rootBox = new BoxRenderable(renderer, {
      width: '100%',
      height: '100%',
      flexDirection: 'column',
    });

    // Header - fixed at top
    this.headerBox = new BoxRenderable(renderer, {
      width: '100%',
      height: 3,
      border: true,
      borderStyle: 'single',
      borderColor: '#555555',
      backgroundColor: '#1a1a2e',
    });

    // Sticky header for current reasoning (hidden initially)
    this.stickyHeaderBox = new BoxRenderable(renderer, {
      width: '100%',
      height: 0,
      backgroundColor: '#1a1a2e',
      borderColor: '#555555',
      paddingLeft: 1,
      visible: false,
    });

    // Scrollable content area
    this.scrollBox = new ScrollBoxRenderable(renderer, {
      width: '100%',
      flexGrow: 1,
      scrollY: true,
      backgroundColor: '#0f0f1a',
    });

    // Footer - fixed at bottom
    this.footerBox = new BoxRenderable(renderer, {
      width: '100%',
      height: 3,
      border: true,
      borderStyle: 'single',
      borderColor: '#555555',
      backgroundColor: '#1a1a2e',
      paddingLeft: 1,
      paddingTop: 0,
    });

    this.rootBox.add(this.headerBox);
    this.rootBox.add(this.stickyHeaderBox);
    this.rootBox.add(this.scrollBox);
    this.rootBox.add(this.footerBox);

    renderer.root.add(this.rootBox);

    // Set up scroll tracking for sticky header
    this.setupScrollTracking();

    this.buildUI();
  }

  private setupScrollTracking(): void {
    // Use a frame callback to check scroll position and update sticky header
    let lastScrollTop = -1;
    this.renderer.setFrameCallback(async () => {
      const scrollTop = this.scrollBox.scrollTop;
      if (scrollTop !== lastScrollTop) {
        lastScrollTop = scrollTop;
        this.updateStickyHeader(scrollTop);
      }
    });
  }

  private updateStickyHeader(scrollTop: number): void {
    // Calculate content positions for each reasoning box
    const contentChildren = this.scrollBox.content.getChildren();
    let contentOffset = 0;

    for (let i = 0; i < contentChildren.length; i++) {
      const reasoningBox = contentChildren[i];
      const item = this.itemRenderables.find(
        (it) => it.type === 'reasoning' && it.renderable === reasoningBox
      );

      if (!item) {
        contentOffset += reasoningBox.height;
        continue;
      }

      const boxTop = contentOffset;
      const boxHeight = reasoningBox.height;
      const boxBottom = boxTop + boxHeight;

      // Get the header box (first child of reasoning box)
      const reasoningHeaderBox = reasoningBox.getChildren()[0];
      if (!reasoningHeaderBox) {
        contentOffset += boxHeight;
        continue;
      }

      const reasoningHeaderHeight = reasoningHeaderBox.height || 2;

      // Check if reasoning header should stick
      if (scrollTop > boxTop && scrollTop < boxBottom - reasoningHeaderHeight) {
        const offset = scrollTop - boxTop;
        reasoningHeaderBox.translateY = offset;
        reasoningHeaderBox.zIndex = 100;
      } else {
        reasoningHeaderBox.translateY = 0;
        reasoningHeaderBox.zIndex = 0;
      }

      // Now check file headers within this reasoning
      const reasoningChildren = reasoningBox.getChildren();
      let fileOffset = reasoningHeaderHeight; // Start after reasoning header

      for (let j = 1; j < reasoningChildren.length; j++) {
        const fileBox = reasoningChildren[j];
        const fileItem = this.itemRenderables.find(
          (it) => it.type === 'file' && it.renderable === fileBox
        );

        if (!fileItem) {
          fileOffset += fileBox.height;
          continue;
        }

        const fileTop = boxTop + fileOffset;
        const fileHeight = fileBox.height;
        const fileBottom = fileTop + fileHeight;

        // Get file header (first child of file box)
        const fileHeaderBox = fileBox.getChildren()[0];
        if (!fileHeaderBox) {
          fileOffset += fileHeight;
          continue;
        }

        const fileHeaderHeight = fileHeaderBox.height || 1;
        // File header should stick below reasoning header
        const stickyTop = reasoningHeaderHeight;

        // If we've scrolled past the file header but not past the file content
        if (scrollTop > fileTop - stickyTop && scrollTop < fileBottom - fileHeaderHeight - stickyTop) {
          const offset = scrollTop - fileTop + stickyTop;
          fileHeaderBox.translateY = offset;
          fileHeaderBox.zIndex = 99;
        } else {
          fileHeaderBox.translateY = 0;
          fileHeaderBox.zIndex = 0;
        }

        fileOffset += fileHeight;
      }

      contentOffset += boxHeight;
    }

    // Hide the separate sticky header box (not using it anymore)
    this.stickyHeaderBox.visible = false;
    this.stickyHeaderBox.height = 0;
  }

  private buildUI(): void {
    // Pre-compute the list of selectable items FIRST (before rendering)
    this.selectableItems = this.computeSelectableItems();
    this.itemRenderables = [];

    // Clear scrollbox content
    const children = this.scrollBox.getChildren();
    for (const child of children) {
      this.scrollBox.remove(child.id);
    }

    // Build header
    this.buildHeader();

    // Build content (now selection checks work correctly)
    this.buildContent();

    // Build footer
    this.buildFooter();
  }

  private computeSelectableItems(): SelectableItem[] {
    const items: SelectableItem[] = [];

    this.state.reasoningGroups.forEach((group, reasoningIdx) => {
      // Add reasoning item
      items.push({ type: 'reasoning', reasoningIdx });

      // If expanded, add file items
      if (this.state.expandedReasonings.has(reasoningIdx)) {
        group.files.forEach((file) => {
          items.push({ type: 'file', reasoningIdx, filePath: file.path });
        });
      }
    });

    return items;
  }

  private buildHeader(): void {
    // Clear header
    const headerChildren = this.headerBox.getChildren();
    for (const child of headerChildren) {
      this.headerBox.remove(child.id);
    }

    const totalChanges = this.state.reasoningGroups.length;
    const headerText = new TextRenderable(this.renderer, {
      content: ` CodeWalker - ${this.state.branch} (${totalChanges} logical changes)`,
      fg: '#88ccff',
      paddingTop: 0,
      paddingLeft: 1,
    });
    this.headerBox.add(headerText);
  }

  private buildContent(): void {
    this.state.reasoningGroups.forEach((group, reasoningIdx) => {
      const isExpanded = this.state.expandedReasonings.has(reasoningIdx);
      const isSelected = this.isReasoningSelected(reasoningIdx);
      // Highlight expanded reasoning blocks
      const isHighlighted = isExpanded;

      // Reasoning container - no paddingTop so sticky header goes all the way to top
      const reasoningBox = new BoxRenderable(this.renderer, {
        width: '100%',
        flexDirection: 'column',
        paddingLeft: 1,
        marginTop: reasoningIdx > 0 ? 1 : 0, // Add spacing between sections (not above first)
        backgroundColor: isHighlighted ? '#1a1a3e' : '#0f0f1a',
      });

      // Clickable reasoning header box (with background for sticky behavior)
      const defaultBg = isHighlighted ? '#2a2a4e' : '#0f0f1a';
      const hoverBg = '#3a3a5e';
      // Use hover-style background for keyboard selection
      const effectiveBg = isSelected ? hoverBg : defaultBg;
      const reasoningHeaderBox = new BoxRenderable(this.renderer, {
        width: '100%',
        backgroundColor: effectiveBg,
        onMouseOver: function() {
          this.backgroundColor = hoverBg;
        },
        onMouseOut: function() {
          this.backgroundColor = effectiveBg;
        },
        onMouseDown: () => {
          this.toggleReasoningByIndex(reasoningIdx);
        },
      });

      // Reasoning header with arrow and text
      const arrow = isExpanded ? '▼' : '▶';
      const fileCount = group.files.length;
      const reasoningHeader = new TextRenderable(this.renderer, {
        content: `${arrow} ${group.reasoning} (${fileCount} file${fileCount !== 1 ? 's' : ''})`,
        fg: isHighlighted ? '#ffffff' : '#cccccc',
        width: '100%',
      });
      reasoningHeaderBox.add(reasoningHeader);
      reasoningBox.add(reasoningHeaderBox);

      this.itemRenderables.push({
        type: 'reasoning',
        reasoningIdx,
        renderable: reasoningBox,
      });

      // If expanded, show files
      if (isExpanded) {
        group.files.forEach((file) => {
          const fileKey = `${reasoningIdx}|${file.path}`;
          const isFileExpanded = this.state.expandedFiles.has(fileKey);
          const isFileSelected = this.isFileSelected(reasoningIdx, file.path);

          // File container
          const fileBox = new BoxRenderable(this.renderer, {
            width: '100%',
            flexDirection: 'column',
            paddingLeft: 3,
          });

          // Clickable file header box
          const filePath = file.path;
          const fileDefaultBg = '#0f0f1a';
          const fileHoverBg = '#3a3a5e';
          // Use hover-style background for keyboard selection
          const fileEffectiveBg = isFileSelected ? fileHoverBg : fileDefaultBg;
          const fileHeaderBox = new BoxRenderable(this.renderer, {
            width: '100%',
            backgroundColor: fileEffectiveBg,
            onMouseOver: function() {
              this.backgroundColor = fileHoverBg;
            },
            onMouseOut: function() {
              this.backgroundColor = fileEffectiveBg;
            },
            onMouseDown: () => {
              this.toggleFileByKey(reasoningIdx, filePath);
            },
          });

          // File header
          const fileArrow = isFileExpanded ? '▼' : '▶';
          const fileHeader = new TextRenderable(this.renderer, {
            content: `${fileArrow} ${file.path}`,
            fg: '#6699cc',
          });
          fileHeaderBox.add(fileHeader);
          fileBox.add(fileHeaderBox);

          this.itemRenderables.push({
            type: 'file',
            reasoningIdx,
            filePath: file.path,
            renderable: fileBox,
          });

          // If file is expanded, show diff
          if (isFileExpanded && file.hunks.length > 0) {
            const diffContent = hunksToUnifiedDiff(file.path, file.hunks);
            const fileType = getFileType(file.path);

            const diffBox = new BoxRenderable(this.renderer, {
              width: '100%',
              border: true,
              borderStyle: 'single',
              borderColor: '#444444',
              title: file.path,
              titleAlignment: 'left',
              marginLeft: 2,
              marginTop: 1,
              marginBottom: 1,
            });

            const diffRenderable = new DiffRenderable(this.renderer, {
              diff: diffContent,
              view: 'unified',
              showLineNumbers: true,
              filetype: fileType,
              addedBg: '#1a3d1a',
              removedBg: '#3d1a1a',
              contextBg: '#1a1a2e',
              addedSignColor: '#22cc22',
              removedSignColor: '#cc2222',
              lineNumberFg: '#666666',
              width: '100%',
            });

            diffBox.add(diffRenderable);
            fileBox.add(diffBox);
          }

          reasoningBox.add(fileBox);
        });
      }

      this.scrollBox.add(reasoningBox);
    });
  }

  private toggleReasoningByIndex(reasoningIdx: number): void {
    // Update selection to this reasoning
    const itemIndex = this.selectableItems.findIndex(
      (item) => item.type === 'reasoning' && item.reasoningIdx === reasoningIdx
    );
    if (itemIndex >= 0) {
      this.state.selectedIndex = itemIndex;
    }

    if (this.state.expandedReasonings.has(reasoningIdx)) {
      this.state.expandedReasonings.delete(reasoningIdx);
      // Collapse all files in this reasoning
      for (const key of this.state.expandedFiles) {
        if (key.startsWith(`${reasoningIdx}|`)) {
          this.state.expandedFiles.delete(key);
        }
      }
    } else {
      this.state.expandedReasonings.add(reasoningIdx);
      // Auto-expand all files in this reasoning
      const group = this.state.reasoningGroups[reasoningIdx];
      if (group) {
        for (const file of group.files) {
          this.state.expandedFiles.add(`${reasoningIdx}|${file.path}`);
        }
      }
    }
    this.buildUI();
  }

  private toggleFileByKey(reasoningIdx: number, filePath: string): void {
    // Update selection to this file
    const itemIndex = this.selectableItems.findIndex(
      (item) => item.type === 'file' && item.reasoningIdx === reasoningIdx && item.filePath === filePath
    );
    if (itemIndex >= 0) {
      this.state.selectedIndex = itemIndex;
    }

    const fileKey = `${reasoningIdx}|${filePath}`;
    if (this.state.expandedFiles.has(fileKey)) {
      this.state.expandedFiles.delete(fileKey);
    } else {
      this.state.expandedFiles.add(fileKey);
    }
    this.buildUI();
  }

  private buildFooter(): void {
    // Clear footer
    const footerChildren = this.footerBox.getChildren();
    for (const child of footerChildren) {
      this.footerBox.remove(child.id);
    }

    const totalItems = this.selectableItems.length;
    const currentPos = this.state.selectedIndex + 1;

    const footerText = new TextRenderable(this.renderer, {
      content: `j/k: navigate │ Enter/click: expand │ q: quit          [${currentPos}/${totalItems}]`,
      fg: '#888888',
    });
    this.footerBox.add(footerText);
  }

  private isReasoningSelected(reasoningIdx: number): boolean {
    const selectedItem = this.selectableItems[this.state.selectedIndex];
    return selectedItem?.type === 'reasoning' && selectedItem.reasoningIdx === reasoningIdx;
  }

  private isFileSelected(reasoningIdx: number, filePath: string): boolean {
    const selectedItem = this.selectableItems[this.state.selectedIndex];
    return selectedItem?.type === 'file' && selectedItem.reasoningIdx === reasoningIdx && selectedItem.filePath === filePath;
  }

  public getItemCount(): number {
    return this.selectableItems.length;
  }

  public toggleExpand(): void {
    const selectedItem = this.selectableItems[this.state.selectedIndex];
    if (!selectedItem) return;

    if (selectedItem.type === 'reasoning') {
      if (this.state.expandedReasonings.has(selectedItem.reasoningIdx)) {
        this.state.expandedReasonings.delete(selectedItem.reasoningIdx);
        // Collapse all files in this reasoning
        for (const key of this.state.expandedFiles) {
          if (key.startsWith(`${selectedItem.reasoningIdx}|`)) {
            this.state.expandedFiles.delete(key);
          }
        }
      } else {
        this.state.expandedReasonings.add(selectedItem.reasoningIdx);
        // Auto-expand all files in this reasoning
        const group = this.state.reasoningGroups[selectedItem.reasoningIdx];
        if (group) {
          for (const file of group.files) {
            this.state.expandedFiles.add(`${selectedItem.reasoningIdx}|${file.path}`);
          }
        }
      }
    } else if (selectedItem.type === 'file' && selectedItem.filePath) {
      const fileKey = `${selectedItem.reasoningIdx}|${selectedItem.filePath}`;
      if (this.state.expandedFiles.has(fileKey)) {
        this.state.expandedFiles.delete(fileKey);
      } else {
        this.state.expandedFiles.add(fileKey);
      }
    }

    this.buildUI();
  }

  public moveSelection(delta: number): void {
    const newIndex = this.state.selectedIndex + delta;
    if (newIndex >= 0 && newIndex < this.selectableItems.length) {
      this.state.selectedIndex = newIndex;
      this.buildUI();
      // Defer scroll to next tick to ensure layout is computed
      setTimeout(() => this.scrollToSelected(), 0);
    }
  }

  private scrollToSelected(): void {
    // Calculate position of selected item and scroll to it
    const selectedItem = this.selectableItems[this.state.selectedIndex];
    if (!selectedItem) return;

    // Find the position by walking through content
    const contentChildren = this.scrollBox.content.getChildren();
    let position = 0;

    for (const reasoningBox of contentChildren) {
      const item = this.itemRenderables.find(
        (it) => it.type === 'reasoning' && it.renderable === reasoningBox
      );

      if (item && item.type === 'reasoning' && item.reasoningIdx === selectedItem.reasoningIdx) {
        if (selectedItem.type === 'reasoning') {
          // Scroll to this reasoning
          this.scrollBox.scrollTop = position;
          return;
        }

        // Look for file within this reasoning
        const reasoningChildren = reasoningBox.getChildren();
        let fileOffset = reasoningChildren[0]?.height || 2; // Skip reasoning header

        for (let i = 1; i < reasoningChildren.length; i++) {
          const fileBox = reasoningChildren[i];
          const fileItem = this.itemRenderables.find(
            (it) => it.type === 'file' && it.renderable === fileBox
          );

          if (fileItem && fileItem.filePath === selectedItem.filePath) {
            this.scrollBox.scrollTop = position + fileOffset;
            return;
          }

          fileOffset += fileBox.height;
        }
      }

      position += reasoningBox.height;
    }
  }

  public refresh(): void {
    this.buildUI();
  }

  public destroy(): void {
    this.renderer.root.remove(this.rootBox.id);
  }
}
