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

    // If tracking info exists, inject it after the file header
    if (tracking && tracking.length > 0) {
      const fileWrapper = containerRef.current.querySelector('.d2h-file-wrapper');
      const fileHeader = containerRef.current.querySelector('.d2h-file-header');

      if (fileWrapper && fileHeader) {
        const trackingHTML = tracking.map(track => `
          <div class="px-4 py-3 border-b last:border-b-0" style="background-color: #eff6ff; border-bottom: 1px solid #bfdbfe;">
            <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
              <div style="flex-shrink: 0; width: 0.5rem; height: 0.5rem; margin-top: 0.375rem; background-color: #3b82f6; border-radius: 9999px;"></div>
              <div style="flex: 1;">
                <div style="font-size: 0.875rem; font-weight: 500; color: #1e3a8a; margin-bottom: 0.25rem;">
                  ${track.reasoning}
                </div>
                <div style="font-size: 0.75rem; color: #1e40af;">
                  <code style="background-color: #dbeafe; padding: 0.125rem 0.375rem; border-radius: 0.25rem;">
                    ${track.commitSha.substring(0, 7)}
                  </code>
                  ${' '}
                  ${track.commitMessage.split('\n')[0]}
                </div>
              </div>
            </div>
          </div>
        `).join('');

        const trackingContainer = document.createElement('div');
        trackingContainer.innerHTML = trackingHTML;
        trackingContainer.style.borderBottom = '1px solid #e5e7eb';

        fileHeader.after(trackingContainer);
      }
    }
  }, [diff, filename, tracking]);

  if (!diff) {
    return null;
  }

  return <div ref={containerRef} className="diff-viewer" />;
}
