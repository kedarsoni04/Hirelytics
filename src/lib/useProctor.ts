/**
 * useProctor — Anti-cheating hook for online assessments.
 *
 * Detects:
 *  - Tab visibility changes  (visibilitychange / Page Visibility API)
 *  - Window blur             (user Alt-Tabs, clicks outside the browser, etc.)
 *  - Copy / paste attempts   (optional, configurable)
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
  type: "tab_switch" | "window_blur" | "copy_attempt" | "paste_attempt";
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
  /** Whether proctoring is active at all. Pass false to disable (e.g., already submitted). */
  enabled?: boolean;
};

export function useProctor({
  maxViolations = 3,
  onForceSubmit,
  trackClipboard = true,
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

    const handleCopy = () => {
      addFlag({
        type: "copy_attempt",
        timestamp: new Date().toISOString(),
        details: "Candidate attempted to copy content during assessment.",
      });
    };

    const handlePaste = () => {
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

  return {
    proctorFlags,
    violationCount: proctorFlags.length,
    showWarning,
    lastViolation,
    dismissWarning,
  };
}
