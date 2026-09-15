"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useCallback, useEffect } from "react";
import type { ImageEditorInstance, ImageEditorSaveResult } from "@unlayer/react-image-editor";

const ImageEditor = dynamic(
  () => import("@unlayer/react-image-editor").then((m) => m.ImageEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center border border-[var(--desk-edge)] bg-[var(--desk-deep)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--desk-edge)] border-t-[var(--folder)]" />
          <span className="field text-[var(--on-desk-muted)]">
            Mounting exhibit
            <span className="caret">_</span>
          </span>
        </div>
      </div>
    ),
  }
) as unknown as React.ComponentType<{
  image: string;
  minHeight?: number | string;
  style?: React.CSSProperties;
  options?: Record<string, unknown>;
  onLoad?: (editor: ImageEditorInstance) => void;
  onSave?: (result: ImageEditorSaveResult) => void;
  onLoadError?: () => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}>;

type Props = {
  image: string;
  onSubmit: (dataUrl: string, blob: Blob) => void;
  onError?: (message: string) => void;
};

export function ForensicsTerminal({ image, onSubmit, onError }: Props) {
  const editorRef = useRef<ImageEditorInstance | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(() => {
      setHasChanges(editorRef.current?.hasChanges() ?? false);
    }, 400);
  }, [stopPolling]);

  const handleLoad = useCallback(
    (editor: ImageEditorInstance) => {
      editorRef.current = editor;
      setReady(true);
      setLoadFailed(false);
      startPolling();
    },
    [startPolling]
  );

  const handleSave = useCallback(
    (r: ImageEditorSaveResult) => onSubmit(r.dataUrl, r.blob),
    [onSubmit]
  );
  const handleError = useCallback(
    (err: Error) => onError?.(err.message || "Terminal failed to mount"),
    [onError]
  );
  const handleLoadError = useCallback(() => {
    setLoadFailed(true);
    onError?.("Exhibit failed to mount in the editor");
  }, [onError]);

  return (
    <div className="flex flex-col gap-4">
      {/* Status, read as a clerk's stamp line rather than a toolbar */}
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-y border-[var(--desk-edge)] py-3">
        <span className="flex items-baseline gap-2">
          <span className="field text-[var(--on-desk-faint)]">Terminal</span>
          <span
            className="field"
            style={{
              color: loadFailed
                ? "var(--stamp)"
                : ready
                  ? "var(--clear)"
                  : "var(--folder)",
            }}
          >
            {loadFailed ? "Failed" : ready ? "Ready" : "Mounting"}
          </span>
        </span>

        {ready && (
          <span className="flex items-baseline gap-2">
            <span className="field text-[var(--on-desk-faint)]">Exhibit state</span>
            <span
              className="field"
              style={{ color: hasChanges ? "var(--folder)" : "var(--on-desk-faint)" }}
            >
              {hasChanges ? "Altered" : "Unchanged"}
            </span>
          </span>
        )}

        <span className="field ml-auto text-[var(--on-desk-faint)]">
          Save inside the editor to submit
        </span>
      </div>

      <div className="border border-[var(--desk-edge)] bg-[var(--desk-deep)] p-2.5">
        <div className="overflow-hidden border border-[var(--desk-edge)]">
          <ImageEditor
            image={image}
            minHeight={520}
            style={{ borderRadius: 0, overflow: "hidden" } as React.CSSProperties}
            options={{ theme: "dark" }}
            onLoad={handleLoad}
            onSave={handleSave}
            onLoadError={handleLoadError}
            onError={handleError}
          />
        </div>
      </div>

      {loadFailed && (
        <div className="border border-[var(--stamp)] bg-[var(--stamp-wash)] px-4 py-3">
          <p className="text-[13px] text-[var(--stamp)]">
            The exhibit failed to mount. Close the terminal and open it again.
          </p>
        </div>
      )}

      <p className="text-[12.5px] leading-[1.7] text-[var(--on-desk-muted)]">
        {ready
          ? "Alter the exhibit so the flagged zones can no longer be read, then save inside the editor to submit it to forensics."
          : "Waiting for the editor to mount the exhibit."}
      </p>
    </div>
  );
}
