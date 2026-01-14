import {
  createCliRenderer,
  type CliRenderer,
  BoxRenderable,
  TextRenderable,
  ScrollBoxRenderable,
  DiffRenderable,
} from '@opentui/core';
import type { ReasoningGroup } from '../utils/tracking.js';

export interface AppState {
  branch: string;
  reasoningGroups: ReasoningGroup[];
  selectedIndex: number;
  expandedReasonings: Set<number>;
  expandedFiles: Set<string>; // "reasoningIndex|filePath"
}

export function createAppState(
  branch: string,
  reasoningGroups: ReasoningGroup[]
): AppState {
  return {
    branch,
    reasoningGroups,
    selectedIndex: 0,
    expandedReasonings: new Set(),
    expandedFiles: new Set(),
  };
}

export { createCliRenderer, BoxRenderable, TextRenderable, ScrollBoxRenderable, DiffRenderable };
export type { CliRenderer };
