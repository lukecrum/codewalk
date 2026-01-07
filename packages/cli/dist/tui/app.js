"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAppState = createAppState;
exports.clearScreen = clearScreen;
exports.hideCursor = hideCursor;
exports.showCursor = showCursor;
exports.getTerminalSize = getTerminalSize;
exports.setupKeyboardInput = setupKeyboardInput;
exports.cleanupInput = cleanupInput;
exports.truncate = truncate;
const readline = __importStar(require("readline"));
function createAppState(branch, trackedCommits) {
    return {
        branch,
        trackedCommits,
        viewMode: 'tree',
        selectedIndex: 0,
        expandedSet: new Set(),
        scrollOffset: 0,
    };
}
function clearScreen() {
    process.stdout.write('\x1B[2J\x1B[H');
}
function hideCursor() {
    process.stdout.write('\x1B[?25l');
}
function showCursor() {
    process.stdout.write('\x1B[?25h');
}
function getTerminalSize() {
    return {
        rows: process.stdout.rows || 24,
        cols: process.stdout.columns || 80,
    };
}
function setupKeyboardInput(onKey, onExit) {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
            onExit();
            return;
        }
        onKey(key.name || str, key.ctrl || false);
    });
    process.stdin.resume();
}
function cleanupInput() {
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
    }
    showCursor();
}
function truncate(str, maxLen) {
    if (str.length <= maxLen)
        return str;
    return str.slice(0, maxLen - 3) + '...';
}
