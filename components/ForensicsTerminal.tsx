"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useCallback, useEffect } from "react";
import type { ImageEditorInstance, ImageEditorSaveResult } from "@unlayer/react-image-editor";

const ImageEditor = dynamic(
  () => import("@unlayer/react-image-editor").then((m) => m.ImageEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <span className="micro text-[var(--muted)]">Initializing forensics terminal…</span>
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

  const handleSave = useCallback((r: ImageEditorSaveResult) => onSubmit(r.dataUrl, r.blob), [onSubmit]);
  const handleError = useCallback((err: Error) => onError?.(err.message || "Terminal failed to load"), [onError]);
  const handleLoadError = useCallback(() => {
    setLoadFailed(true);
    onError?.("Evidence image failed to load into editor");
  }, [onError]);

  return (
    <div className="flex flex-col gap-4">
      {/* Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${ready ? "bg-[var(--success)] shadow-[0_0_8px_rgba(20,240,184,0.5)]" : "bg-[var(--warning)] animate-[pulse-dot_1.2s_ease-in-out_infinite]"}`} />
          <span className="text-xs font-medium tracking-[-0.15px] text-[var(--ink)]">
            {loadFailed ? "Evidence corrupted — retry" : ready ? "System online — edit to tamper" : "Booting…"}
          </span>
        </div>
        <span className="micro hidden text-[var(--faint)] sm:inline">Crop · Draw · Filter · Sticker · Text · Shapes · Frame</span>
        {ready && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-[-0.15px] ${hasChanges ? "bg-[var(--success-soft)] text-[var(--success)] ring-1 ring-[var(--success-line)]" : "bg-[var(--paper-soft)] text-[var(--faint)] ring-1 ring-[var(--line)]"}`}>
            {hasChanges ? "● Tampered" : "○ No changes"}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <ImageEditor
          image={image}
          minHeight={520}
          style={{ borderRadius: 16, overflow: "hidden" } as React.CSSProperties}
          options={{ theme: "dark" }}
          onLoad={handleLoad}
          onSave={handleSave}
          onLoadError={handleLoadError}
          onError={handleError}
        />
      </div>

      {loadFailed && (
        <div className="rounded-2xl border border-[var(--danger-line)] bg-[var(--danger-soft)] px-4 py-3 text-center">
          <p className="text-sm font-medium text-[var(--danger)]">Evidence failed to load. Try again or go back to the locker.</p>
        </div>
      )}

      <p className="micro text-center text-[var(--faint)]">
        {ready ? "Edit the image above, then press Save inside the editor to submit to forensics." : "Waiting for terminal…"}
      </p>
    </div>
  );
}
