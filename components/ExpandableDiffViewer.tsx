'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { ParsedHunk, HunkGap } from '@/types/codewalker';
import { computeHunkGaps } from '@/lib/github';

type ExpandableDiffViewerProps = {
  filename: string;
  hunks: ParsedHunk[];
  owner: string;
  repo: string;
  commitSha: string;
  token?: string;
  indent?: boolean;
};

type ExpandedLines = {
  [gapKey: string]: {
    loading: boolean;
    lines?: Array<{ lineNumber: number; content: string }>;
    error?: string;
  };
};

function getGapKey(gap: HunkGap): string {
  return `${gap.afterHunkIndex}:${gap.oldStartLine}-${gap.oldEndLine}`;
}

type LineItem = {
  type: 'hunk-header' | 'line' | 'expanded-line';
  hunk?: ParsedHunk;
  line?: ParsedHunk['lines'][0];
  expandedLine?: { lineNumber: number; content: string };
};

type Segment = {
  type: 'content';
  lines: LineItem[];
};

type ExpandButton = {
  type: 'expand';
  gap: HunkGap;
};

type SegmentOrButton = Segment | ExpandButton;

export default function ExpandableDiffViewer({
  filename,
  hunks,
  owner,
  repo,
  commitSha,
  token,
  indent = false,
}: ExpandableDiffViewerProps) {
  const [expandedLines, setExpandedLines] = useState<ExpandedLines>({});

  const gaps = useMemo(() => computeHunkGaps(hunks), [hunks]);

  const handleExpand = async (gap: HunkGap) => {
    const key = getGapKey(gap);

    if (expandedLines[key]?.lines) {
      setExpandedLines((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    setExpandedLines((prev) => ({
      ...prev,
      [key]: { loading: true },
    }));

    try {
      const params = new URLSearchParams({
        owner,
        repo,
        sha: commitSha,
        path: filename,
        startLine: gap.oldStartLine.toString(),
        endLine: gap.oldEndLine.toString(),
      });
      if (token) params.append('token', token);

      const response = await fetch(`/api/github/file-content?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch lines');
      }

      setExpandedLines((prev) => ({
        ...prev,
        [key]: { loading: false, lines: data.lines },
      }));
    } catch (error: any) {
      setExpandedLines((prev) => ({
        ...prev,
        [key]: { loading: false, error: error.message },
      }));
    }
  };

  const getGapAfterHunk = (hunkIndex: number) => {
    return gaps.find((g) => g.afterHunkIndex === hunkIndex);
  };

  const gapBeforeFirst = gaps.find((g) => g.afterHunkIndex === -1);

  if (hunks.length === 0) {
    return null;
  }

  // Build segments and expand buttons
  const buildSegments = (): SegmentOrButton[] => {
    const result: SegmentOrButton[] = [];

    // Gap before first hunk
    if (gapBeforeFirst) {
      result.push({ type: 'expand', gap: gapBeforeFirst });

      // If expanded, add expanded lines as a segment
      const key = getGapKey(gapBeforeFirst);
      const state = expandedLines[key];
      if (state?.lines && state.lines.length > 0) {
        const expandedSegment: Segment = {
          type: 'content',
          lines: state.lines.map((line) => ({
            type: 'expanded-line' as const,
            expandedLine: line,
          })),
        };
        result.push(expandedSegment);
      }
    }

    // Process each hunk
    hunks.forEach((hunk, hunkIndex) => {
      // Build lines for this hunk
      const hunkLines: LineItem[] = [
        { type: 'hunk-header', hunk },
        ...hunk.lines.map((line) => ({ type: 'line' as const, line, hunk })),
      ];

      result.push({ type: 'content', lines: hunkLines });

      // Gap after this hunk
      const gap = getGapAfterHunk(hunkIndex);
      if (gap) {
        result.push({ type: 'expand', gap });

        // If expanded, add expanded lines as a segment
        const key = getGapKey(gap);
        const state = expandedLines[key];
        if (state?.lines && state.lines.length > 0) {
          const expandedSegment: Segment = {
            type: 'content',
            lines: state.lines.map((line) => ({
              type: 'expanded-line' as const,
              expandedLine: line,
            })),
          };
          result.push(expandedSegment);
        }
      }
    });

    return result;
  };

  const segments = buildSegments();

  return (
    <div
      className="diff-viewer expandable-diff"
      style={indent ? { marginLeft: '1rem', marginRight: '1rem' } : undefined}
    >
      {segments.map((segment, idx) => {
        if (segment.type === 'expand') {
          return (
            <ExpandButtonRow
              key={`expand-${idx}`}
              gap={segment.gap}
              expandedLines={expandedLines}
              onExpand={handleExpand}
            />
          );
        }

        return (
          <DiffSegment
            key={`segment-${idx}`}
            lines={segment.lines}
          />
        );
      })}
    </div>
  );
}

type ExpandButtonRowProps = {
  gap: HunkGap;
  expandedLines: ExpandedLines;
  onExpand: (gap: HunkGap) => void;
};

function ExpandButtonRow({ gap, expandedLines, onExpand }: ExpandButtonRowProps) {
  const key = getGapKey(gap);
  const state = expandedLines[key];
  const isExpanded = !!state?.lines;
  const isLoading = state?.loading;

  return (
    <div className="expand-row">
      <button
        onClick={() => onExpand(gap)}
        disabled={isLoading}
        className="expand-button"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            <span>Hide {gap.lineCount} lines</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            <span>Expand {gap.lineCount} hidden lines</span>
          </>
        )}
      </button>
      {state?.error && (
        <span className="expand-error">Error: {state.error}</span>
      )}
    </div>
  );
}

type DiffSegmentProps = {
  lines: LineItem[];
};

function DiffSegment({ lines }: DiffSegmentProps) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // Sync vertical scroll between panels
  const handleScroll = useCallback((source: 'left' | 'right') => {
    const sourceRef = source === 'left' ? leftRef : rightRef;
    const targetRef = source === 'left' ? rightRef : leftRef;

    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollTop = sourceRef.current.scrollTop;
    }
  }, []);

  return (
    <div className="diff-segment">
      <div className="diff-segment-panels">
        <div
          className="diff-panel diff-panel-left"
          ref={leftRef}
          onScroll={() => handleScroll('left')}
        >
          <table className="diff-table">
            <tbody>
              {lines.map((item, idx) => (
                <LeftSideRow key={idx} item={item} />
              ))}
            </tbody>
          </table>
        </div>
        <div
          className="diff-panel diff-panel-right"
          ref={rightRef}
          onScroll={() => handleScroll('right')}
        >
          <table className="diff-table">
            <tbody>
              {lines.map((item, idx) => (
                <RightSideRow key={idx} item={item} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LeftSideRow({ item }: { item: LineItem }) {
  if (item.type === 'hunk-header') {
    return (
      <tr className="diff-hunk-header">
        <td className="diff-line-number"></td>
        <td className="diff-line-content">
          <span className="diff-hunk-info">{item.hunk?.header}</span>
        </td>
      </tr>
    );
  }

  if (item.type === 'expanded-line') {
    const line = item.expandedLine!;
    return (
      <tr className="diff-line diff-context">
        <td className="diff-line-number">{line.lineNumber}</td>
        <td className="diff-line-content">
          <span className="diff-line-prefix"> </span>
          <span className="diff-line-text">{line.content}</span>
        </td>
      </tr>
    );
  }

  const line = item.line!;

  if (line.type === 'add') {
    return (
      <tr className="diff-line diff-empty">
        <td className="diff-line-number"></td>
        <td className="diff-line-content"></td>
      </tr>
    );
  }

  const lineClass = line.type === 'remove' ? 'diff-del' : 'diff-context';
  const prefix = line.type === 'remove' ? '-' : ' ';

  return (
    <tr className={`diff-line ${lineClass}`}>
      <td className={`diff-line-number ${lineClass}`}>{line.oldLineNum}</td>
      <td className={`diff-line-content ${lineClass}`}>
        <span className="diff-line-prefix">{prefix}</span>
        <span className="diff-line-text">{line.content}</span>
      </td>
    </tr>
  );
}

function RightSideRow({ item }: { item: LineItem }) {
  if (item.type === 'hunk-header') {
    return (
      <tr className="diff-hunk-header">
        <td className="diff-line-number"></td>
        <td className="diff-line-content">
          <span className="diff-hunk-info">{item.hunk?.header}</span>
        </td>
      </tr>
    );
  }

  if (item.type === 'expanded-line') {
    const line = item.expandedLine!;
    return (
      <tr className="diff-line diff-context">
        <td className="diff-line-number">{line.lineNumber}</td>
        <td className="diff-line-content">
          <span className="diff-line-prefix"> </span>
          <span className="diff-line-text">{line.content}</span>
        </td>
      </tr>
    );
  }

  const line = item.line!;

  if (line.type === 'remove') {
    return (
      <tr className="diff-line diff-empty">
        <td className="diff-line-number"></td>
        <td className="diff-line-content"></td>
      </tr>
    );
  }

  const lineClass = line.type === 'add' ? 'diff-ins' : 'diff-context';
  const prefix = line.type === 'add' ? '+' : ' ';

  return (
    <tr className={`diff-line ${lineClass}`}>
      <td className={`diff-line-number ${lineClass}`}>{line.newLineNum}</td>
      <td className={`diff-line-content ${lineClass}`}>
        <span className="diff-line-prefix">{prefix}</span>
        <span className="diff-line-text">{line.content}</span>
      </td>
    </tr>
  );
}
