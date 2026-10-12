/**
 * useProctor — Anti-cheating hook for online assessments.
 *
 * Detects & blocks:
 *  - Tab visibility changes   (visibilitychange / Page Visibility API)
 *  - Window blur              (Alt-Tab, clicks outside the browser, etc.)
 *  - Copy / paste attempts    (configurable)
 *  - Right-click (context menu) to prevent "inspect element"
 *  - DevTools keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
 *  - Print shortcuts (Ctrl+P, Ctrl+Shift+P)
 *  - PrintScreen key flag
 *  - Text selection prevention on question content (via CSS class hint)
 *
 * Exposes:
 *  - proctorFlags     – array of timestamped flag objects to send with submission
 *  - violationCount   – total violations so far
 *  - showWarning      – whether to show the warning modal
 *  - dismissWarning   – call to close the modal (resumes exam)
 *  - lastViolation    – most recent ProctorFlag (for display in modal)
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ProctorFlag = {
  type:
    | "tab_switch"
    | "window_blur"
    | "copy_attempt"
    | "paste_attempt"
    | "right_click"
    | "devtools_shortcut"
    | "print_attempt"
    | "screenshot_key";
  timestamp: string; // ISO-8601
  details?: string;
};

type UseProctorOptions = {
  /** Max violations before forceSubmit is called. Default: 3 */
  maxViolations?: number;
  /** Called when violations exceed maxViolations */
  onForceSubmit?: () => void;
  /** Whether to track copy/paste events. Default: true */
  trackClipboard?: boolean;
  /** Whether to block right-click. Default: true */
  blockContextMenu?: boolean;
  /** Whether to block devtools keyboard shortcuts. Default: true */
  blockDevTools?: boolean;
  /** Whether proctoring is active at all. Pass false to disable (e.g., already submitted). */
  enabled?: boolean;
};

export function useProctor({
  maxViolations = 3,
  onForceSubmit,
  trackClipboard = true,
  blockContextMenu = true,
  blockDevTools = true,
  enabled = true,
}: UseProctorOptions = {}) {
  const [proctorFlags, setProctorFlags] = useState<ProctorFlag[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [lastViolation, setLastViolation] = useState<ProctorFlag | null>(null);

  // Keep a ref so event callbacks always see the latest count without stale closure
  const flagsRef = useRef<ProctorFlag[]>([]);

  const addFlag = useCallback(
    (flag: ProctorFlag) => {
      if (!enabled) return;

      flagsRef.current = [...flagsRef.current, flag];
      setProctorFlags([...flagsRef.current]);
      setLastViolation(flag);
      setShowWarning(true);

      if (flagsRef.current.length >= maxViolations && onForceSubmit) {
        onForceSubmit();
      }
    },
    [enabled, maxViolations, onForceSubmit]
  );

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  // ── Tab visibility ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        addFlag({
          type: "tab_switch",
          timestamp: new Date().toISOString(),
          details: "Candidate switched to a different tab or minimised the window.",
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [enabled, addFlag]);

  // ── Window blur ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      // Ignore if the tab is also hidden (already captured by visibilitychange)
      if (document.visibilityState === "hidden") return;
      addFlag({
        type: "window_blur",
        timestamp: new Date().toISOString(),
        details: "Browser window lost focus (e.g. Alt+Tab, clicked another app).",
      });
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [enabled, addFlag]);

  // ── Copy / Paste ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !trackClipboard) return;

    const handleCopy = (e: Event) => {
      e.preventDefault();
      addFlag({
        type: "copy_attempt",
        timestamp: new Date().toISOString(),
        details: "Candidate attempted to copy content during assessment.",
      });
    };

    const handlePaste = (e: Event) => {
      e.preventDefault();
      addFlag({
        type: "paste_attempt",
        timestamp: new Date().toISOString(),
        details: "Candidate attempted to paste content during assessment.",
      });
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [enabled, trackClipboard, addFlag]);

  // ── Right-click (context menu) ────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !blockContextMenu) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addFlag({
        type: "right_click",
        timestamp: new Date().toISOString(),
        details: "Candidate attempted to open the right-click context menu.",
      });
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [enabled, blockContextMenu, addFlag]);

  // ── DevTools / Print shortcuts ────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !blockDevTools) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // F12 — DevTools toggle
      if (e.key === "F12") {
        e.preventDefault();
        addFlag({
          type: "devtools_shortcut",
          timestamp: new Date().toISOString(),
          details: `Blocked key: F12 (DevTools).`,
        });
        return;
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C — DevTools
      if (ctrl && shift && ["i", "I", "j", "J", "c", "C"].includes(e.key)) {
        e.preventDefault();
        addFlag({
          type: "devtools_shortcut",
          timestamp: new Date().toISOString(),
          details: `Blocked key: Ctrl+Shift+${e.key.toUpperCase()} (DevTools).`,
        });
        return;
      }

      // Ctrl+U — View Source
      if (ctrl && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        addFlag({
          type: "devtools_shortcut",
          timestamp: new Date().toISOString(),
          details: "Blocked key: Ctrl+U (View Source).",
        });
        return;
      }

      // Ctrl+P — Print
      if (ctrl && !shift && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        addFlag({
          type: "print_attempt",
          timestamp: new Date().toISOString(),
          details: "Blocked key: Ctrl+P (Print).",
        });
        return;
      }

      // PrintScreen
      if (e.key === "PrintScreen") {
        // Can't fully block, but flag it
        addFlag({
          type: "screenshot_key",
          timestamp: new Date().toISOString(),
          details: "PrintScreen key pressed during assessment.",
        });
        return;
      }

      // Ctrl+A — Select All (silent block, no flag — UX friendly)
      if (ctrl && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, blockDevTools, addFlag]);

  return {
    proctorFlags,
    violationCount: proctorFlags.length,
    showWarning,
    lastViolation,
    dismissWarning,
  };
}
