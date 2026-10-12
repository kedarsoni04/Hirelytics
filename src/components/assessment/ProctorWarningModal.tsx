"use client";

import { AlertTriangle, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProctorFlag } from "@/lib/useProctor";

const VIOLATION_LABELS: Record<ProctorFlag["type"], string> = {
  tab_switch: "Tab Switch Detected",
  window_blur: "Window Focus Lost",
  copy_attempt: "Copy Attempt Blocked",
  paste_attempt: "Paste Attempt Blocked",
  right_click: "Right-Click Blocked",
  devtools_shortcut: "Developer Tools Blocked",
  print_attempt: "Print Attempt Blocked",
  screenshot_key: "Screenshot Key Detected",
};

const VIOLATION_DESCRIPTIONS: Record<ProctorFlag["type"], string> = {
  tab_switch:
    "You navigated away from this assessment tab. This is considered a violation.",
  window_blur:
    "You switched to another application or window during the assessment.",
  copy_attempt:
    "You attempted to copy content from the assessment. Clipboard access is disabled during proctored exams.",
  paste_attempt:
    "You attempted to paste content into the assessment. Clipboard access is disabled during proctored exams.",
  right_click:
    "Right-click is disabled during proctored assessments to prevent access to browser tools.",
  devtools_shortcut:
    "A Developer Tools keyboard shortcut was detected and blocked. Accessing browser dev tools is not permitted.",
  print_attempt:
    "A print shortcut was detected and blocked. Printing the assessment content is not permitted.",
  screenshot_key:
    "The PrintScreen key was pressed. Screenshots of assessment content are not permitted and have been logged.",
};

type Props = {
  violationCount: number;
  maxViolations: number;
  lastViolation: ProctorFlag | null;
  onDismiss: () => void;
  /** If true, hides the dismiss button — the exam is about to be force-submitted */
  forceSubmitting?: boolean;
};

export default function ProctorWarningModal({
  violationCount,
  maxViolations,
  lastViolation,
  onDismiss,
  forceSubmitting = false,
}: Props) {
  if (!lastViolation) return null;

  const remaining = maxViolations - violationCount;
  const isLastWarning = remaining <= 0;

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proctor-warning-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
    >
      {/* Modal card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`px-6 py-5 flex items-start gap-4 ${
            isLastWarning ? "bg-red-600" : "bg-amber-500"
          }`}
        >
          <div className="size-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="size-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="proctor-warning-title"
              className="text-base font-bold text-white leading-tight"
            >
              {isLastWarning
                ? "Assessment Being Submitted"
                : VIOLATION_LABELS[lastViolation.type]}
            </h2>
            <p className="text-xs text-white/80 mt-0.5">
              Violation #{violationCount} of {maxViolations} allowed
            </p>
          </div>
          {!isLastWarning && !forceSubmitting && (
            <button
              onClick={onDismiss}
              aria-label="Close warning"
              className="size-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="size-4 text-white" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-900 leading-relaxed">
              {isLastWarning
                ? "You have reached the maximum number of violations. Your assessment is being automatically submitted with your current answers."
                : VIOLATION_DESCRIPTIONS[lastViolation.type]}
            </p>
          </div>

          {!isLastWarning && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">
                Please note:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>All violations are logged and sent to the recruiter.</li>
                <li>
                  You have{" "}
                  <span className="font-semibold text-red-600">
                    {remaining} warning{remaining !== 1 ? "s" : ""} remaining
                  </span>{" "}
                  before automatic submission.
                </li>
                <li>
                  Do not switch tabs, use Alt+Tab, or copy/paste during the exam.
                </li>
                <li>
                  Right-click, DevTools (F12), and print shortcuts are disabled.
                </li>
              </ul>
            </div>
          )}

          {/* Violation badge */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: maxViolations }, (_, i) => (
              <div
                key={i}
                className={`size-3 rounded-full transition-colors ${
                  i < violationCount ? "bg-red-500" : "bg-gray-200"
                }`}
                title={i < violationCount ? `Violation ${i + 1}` : "Remaining"}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1 self-center">
              {violationCount}/{maxViolations} violations
            </span>
          </div>
        </div>

        {/* Footer */}
        {!isLastWarning && !forceSubmitting && (
          <div className="px-6 pb-5">
            <Button
              onClick={onDismiss}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-sm"
            >
              I understand — Resume Assessment
            </Button>
          </div>
        )}

        {isLastWarning && (
          <div className="px-6 pb-5">
            <div className="flex items-center justify-center gap-2 py-3 rounded-lg bg-red-50 border border-red-200">
              <div className="size-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-red-700">
                Submitting your assessment…
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
