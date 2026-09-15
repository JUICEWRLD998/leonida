"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useCallback, useEffect } from "react";
import type { ImageEditorInstance, ImageEditorSaveResult } from "@unlayer/react-image-editor";

const ImageEditor = dynamic(
  () => import("@unlayer/react-image-editor").then((m) => m.ImageEditor),
  {
    ssr: false,
    loading: () => <Mounting label="Mounting exhibit" />,
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
  onCancel?: () => void;
};

// A typewriter is "working" by sitting still, not by spinning.
function Mounting({ label, failed }: { label: string; failed?: boolean }) {
  return (
    <div className="flex h-[520px] items-center justify-center border border-[var(--desk-edge)] bg-[var(--desk-deep)]">
      <p
        className="field"
        style={{ color: failed ? "var(--stamp-ink)" : "var(--on-desk-muted)" }}
      >
        {label}
        {!failed && <span className="caret">_</span>}
      </p>
    </div>
  );
}

export function ForensicsTerminal({ image, onSubmit, onError, onCancel }: Props) {
  const editorRef = useRef<ImageEditorInstance | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  // Bumping this remounts the editor. A failed embed leaves nothing to reset(),
  // so recovery is a fresh mount rather than a call into a dead instance.
  const [attempt, setAttempt] = useState(0);

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

  useEffect(() => {
    // Don't hold a poll interval against an editor that never mounted.
    if (!ready) stopPolling();
  }, [ready, stopPolling]);

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

  const handleLoadError = useCallback(() => {
    setReady(false);
    setLoadFailed(true);
    stopPolling();
    onError?.("The exhibit failed to mount in the editor");
  }, [onError, stopPolling]);

  const handleError = useCallback(
    (err: Error) => {
      setReady(false);
      setLoadFailed(true);
      stopPolling();
      onError?.(err.message || "The editor failed to start");
    },
    [onError, stopPolling]
  );

  const retry = useCallback(() => {
    stopPolling();
    try {
      editorRef.current?.destroy();
    } catch {}
    editorRef.current = null;
    setReady(false);
    setHasChanges(false);
    setLoadFailed(false);
    setAttempt((n) => n + 1);
  }, [stopPolling]);

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
                ? "var(--stamp-ink)"
                : ready
                  ? "var(--clear-ink)"
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
        {loadFailed ? (
          <Mounting label="Terminal offline" failed />
        ) : (
          <div className="overflow-hidden border border-[var(--desk-edge)]">
            <ImageEditor
              key={attempt}
              image={image}
              minHeight={520}
              style={{ borderRadius: 0, overflow: "hidden" } as React.CSSProperties}
              options={{ theme: "dark" }}
              onLoad={handleLoad}
              onSave={handleSave}
              onLoadError={handleLoadError}
              onError={handleError}
              onCancel={onCancel}
            />
          </div>
        )}
      </div>

      {loadFailed && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[var(--stamp-ink)] bg-[var(--stamp-wash)] px-4 py-3">
          <p className="text-[14px] text-[var(--stamp-ink)]">
            The exhibit could not be mounted. Try again, or leave the terminal and
            reopen this exhibit.
          </p>
          <button onClick={retry} className="btn btn-stamp" type="button">
            Retry
          </button>
        </div>
      )}

      <p className="text-[13.5px] leading-[1.7] text-[var(--on-desk-muted)]">
        {ready
          ? "Alter the exhibit so the flagged zones can no longer be read, then save inside the editor to submit it to forensics."
          : loadFailed
            ? "Send the exhibit back through the terminal to mount it again."
            : "Waiting for the editor to mount the exhibit."}
      </p>
    </div>
  );
}
