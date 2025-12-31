'use client';

import { useEffect, useRef } from 'react';
import * as Diff2Html from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';

type TrackingInfo = {
  commitSha: string;
  commitMessage: string;
  reasoning: string;
  hunkNumbers: number[];
};

type DiffViewerProps = {
  diff: string;
  filename: string;
  tracking?: TrackingInfo[];
};

export default function DiffViewer({ diff, filename, tracking }: DiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !diff) return;

    // Create a unified diff format that diff2html expects
    const unifiedDiff = `--- a/${filename}
+++ b/${filename}
${diff}`;

    const html = Diff2Html.html(unifiedDiff, {
      drawFileList: false,
      matching: 'lines',
      outputFormat: 'side-by-side',
      renderNothingWhenEmpty: false,
      fileListToggle: false,
      fileContentToggle: false,
    });

    containerRef.current.innerHTML = html;
  }, [diff, filename, tracking]);

  if (!diff) {
    return null;
  }

  return <div ref={containerRef} className="diff-viewer" />;
}
