'use client';

import { useEffect, useRef } from 'react';
import * as Diff2Html from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';

type DiffViewerProps = {
  diff: string;
  filename: string;
  indent?: boolean;
};

export default function DiffViewer({ diff, filename, indent = false }: DiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !diff) return;

    const unifiedDiff = `--- a/${filename}
+++ b/${filename}
${diff}`;

    const html = Diff2Html.html(unifiedDiff, {
      drawFileList: false,
      matching: 'lines',
      outputFormat: 'side-by-side',
      renderNothingWhenEmpty: false,
    });

    containerRef.current.innerHTML = html;
  }, [diff, filename]);

  if (!diff) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="diff-viewer"
      style={indent ? { marginLeft: '1rem', marginRight: '1rem' } : undefined}
    />
  );
}
