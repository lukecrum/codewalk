import { BoxRenderable, TextRenderable, ScrollBoxRenderable, DiffRenderable, } from '@opentui/core';
// Convert hunks to unified diff format for DiffRenderable
function hunksToUnifiedDiff(filePath, hunks) {
    let diff = `--- a/${filePath}\n+++ b/${filePath}\n`;
    for (const hunk of hunks) {
        diff += hunk.header + '\n';
        diff += hunk.content;
    }
    return diff;
}
// Get file extension for syntax highlighting
function getFileType(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const typeMap = {
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
export class TreeView {
    renderer;
    state;
    rootBox;
    headerBox;
    scrollBox;
    footerBox;
    selectableItems = [];
    constructor(renderer, state) {
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
            height: 2,
            border: true,
            borderStyle: 'single',
            borderColor: '#555555',
            backgroundColor: '#1a1a2e',
            paddingLeft: 1,
        });
        this.rootBox.add(this.headerBox);
        this.rootBox.add(this.scrollBox);
        this.rootBox.add(this.footerBox);
        renderer.root.add(this.rootBox);
        this.buildUI();
    }
    buildUI() {
        // Clear previous content
        this.selectableItems = [];
        // Clear scrollbox content
        const children = this.scrollBox.getChildren();
        for (const child of children) {
            this.scrollBox.remove(child.id);
        }
        // Build header
        this.buildHeader();
        // Build content
        this.buildContent();
        // Build footer
        this.buildFooter();
    }
    buildHeader() {
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
    buildContent() {
        this.state.reasoningGroups.forEach((group, reasoningIdx) => {
            const isExpanded = this.state.expandedReasonings.has(reasoningIdx);
            const isSelected = this.isReasoningSelected(reasoningIdx);
            // Reasoning container
            const reasoningBox = new BoxRenderable(this.renderer, {
                width: '100%',
                flexDirection: 'column',
                paddingLeft: 1,
                paddingTop: 1,
                backgroundColor: isSelected ? '#2a2a4e' : undefined,
            });
            // Reasoning header with arrow and text
            const arrow = isExpanded ? '▼' : '▶';
            const fileCount = group.files.length;
            const reasoningHeader = new TextRenderable(this.renderer, {
                content: `${arrow} ${group.reasoning} (${fileCount} file${fileCount !== 1 ? 's' : ''})`,
                fg: isSelected ? '#ffffff' : '#cccccc',
                width: '100%',
            });
            reasoningBox.add(reasoningHeader);
            this.selectableItems.push({
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
                        paddingTop: 1,
                        backgroundColor: isFileSelected ? '#2a2a4e' : undefined,
                    });
                    // File header
                    const fileArrow = isFileExpanded ? '▼' : '▶';
                    const fileHeader = new TextRenderable(this.renderer, {
                        content: `${fileArrow} ${file.path}`,
                        fg: isFileSelected ? '#88ccff' : '#6699cc',
                    });
                    fileBox.add(fileHeader);
                    this.selectableItems.push({
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
    buildFooter() {
        // Clear footer
        const footerChildren = this.footerBox.getChildren();
        for (const child of footerChildren) {
            this.footerBox.remove(child.id);
        }
        const totalItems = this.selectableItems.length;
        const currentPos = this.state.selectedIndex + 1;
        const footerText = new TextRenderable(this.renderer, {
            content: `j/k: navigate │ Enter: expand/collapse │ q: quit          [${currentPos}/${totalItems}]`,
            fg: '#888888',
        });
        this.footerBox.add(footerText);
    }
    isReasoningSelected(reasoningIdx) {
        const item = this.selectableItems[this.state.selectedIndex];
        return item?.type === 'reasoning' && item.reasoningIdx === reasoningIdx;
    }
    isFileSelected(reasoningIdx, filePath) {
        const item = this.selectableItems[this.state.selectedIndex];
        return item?.type === 'file' && item.reasoningIdx === reasoningIdx && item.filePath === filePath;
    }
    getItemCount() {
        return this.selectableItems.length;
    }
    toggleExpand() {
        const item = this.selectableItems[this.state.selectedIndex];
        if (!item)
            return;
        if (item.type === 'reasoning') {
            if (this.state.expandedReasonings.has(item.reasoningIdx)) {
                this.state.expandedReasonings.delete(item.reasoningIdx);
                // Collapse all files in this reasoning
                for (const key of this.state.expandedFiles) {
                    if (key.startsWith(`${item.reasoningIdx}|`)) {
                        this.state.expandedFiles.delete(key);
                    }
                }
            }
            else {
                this.state.expandedReasonings.add(item.reasoningIdx);
            }
        }
        else if (item.type === 'file' && item.filePath) {
            const fileKey = `${item.reasoningIdx}|${item.filePath}`;
            if (this.state.expandedFiles.has(fileKey)) {
                this.state.expandedFiles.delete(fileKey);
            }
            else {
                this.state.expandedFiles.add(fileKey);
            }
        }
        this.buildUI();
    }
    moveSelection(delta) {
        const newIndex = this.state.selectedIndex + delta;
        if (newIndex >= 0 && newIndex < this.selectableItems.length) {
            this.state.selectedIndex = newIndex;
            this.buildUI();
        }
    }
    refresh() {
        this.buildUI();
    }
    destroy() {
        this.renderer.root.remove(this.rootBox.id);
    }
}
