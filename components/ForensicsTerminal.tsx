"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useCallback, useEffect } from "react";
import type {
  ImageEditorInstance,
  ImageEditorSaveResult,
} from "@unlayer/react-image-editor";

const ImageEditor = dynamic(
  () => import("@unlayer/react-image-editor").then((m) => m.ImageEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-1)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <span className="font-mono text-xs tracking-widest text-[var(--text-2)]">
            INITIALIZING FORENSICS TERMINAL…
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

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(() => {
      const v = editorRef.current?.hasChanges() ?? false;
      setHasChanges(v);
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
    (result: ImageEditorSaveResult) => {
      onSubmit(result.dataUrl, result.blob);
    },
    [onSubmit]
  );

  const handleError = useCallback(
    (err: Error) => {
      onError?.(err.message || "Terminal failed to load");
    },
    [onError]
  );

  const handleLoadError = useCallback(() => {
    setLoadFailed(true);
    onError?.("Evidence image failed to load into editor");
  }, [onError]);

  return (
    <div className="flex flex-col gap-3">
      {/* Status bar */}
      <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-1)] px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${ready ? "bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]" : "bg-[var(--warning)] animate-pulse"}`}
          />
          <span className="font-mono text-xs tracking-widest text-[var(--text-2)]">
            {loadFailed
              ? "EVIDENCE CORRUPTED — RETRY"
              : ready
                ? "SYSTEM ONLINE — EDIT TO TAMPER"
                : "BOOTING…"}
          </span>
        </div>
        <span className="hidden font-mono text-[10px] tracking-widest text-[var(--text-3)] sm:inline">
          CROP · DRAW · FILTER · STICKER · TEXT · SHAPES · FRAME
        </span>
        {ready && (
          <span
            className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest ${hasChanges ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30" : "bg-[var(--bg-2)] text-[var(--text-3)] border border-[var(--border)]"}`}
          >
            {hasChanges ? "● TAMPERED" : "○ NO CHANGES"}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-1)]">
        <ImageEditor
          image={image}
          minHeight={520}
          style={{ borderRadius: 12, overflow: "hidden" } as React.CSSProperties}
          options={{ theme: "dark" }}
          onLoad={handleLoad}
          onSave={handleSave}
          onLoadError={handleLoadError}
          onError={handleError}
        />
      </div>

      {loadFailed && (
        <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-center">
          <p className="font-mono text-xs text-[var(--danger)]">
            Evidence failed to load. Try again or go back to the locker.
          </p>
        </div>
      )}

      <p className="text-center font-mono text-[10px] tracking-widest text-[var(--text-3)]">
        {ready
          ? "Edit the image above, then press SAVE inside the editor to submit to forensics."
          : "Waiting for terminal…"}
      </p>
    </div>
  );
}
