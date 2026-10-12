"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";

interface CountdownTimerProps {
  initialSeconds: number;
  /** Called once when the timer reaches zero — use this to auto-submit */
  onExpire?: () => void;
}

export default function CountdownTimer({ initialSeconds, onExpire }: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        const next = Math.max(0, s - 1);
        if (next === 0 && !expiredRef.current) {
          expiredRef.current = true;
          // Fire onExpire on next tick so state update is flushed first
          setTimeout(() => onExpire?.(), 0);
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isWarning = secondsLeft < 300; // < 5 min
  const isCritical = secondsLeft < 60; // < 1 min

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold transition-colors ${
        isCritical
          ? "bg-[#FFE4E6] text-[#9F1239]"
          : isWarning
          ? "bg-[#FEF3C7] text-[#92400E]"
          : "bg-muted text-foreground"
      }`}
    >
      {isCritical && <AlertCircle className="size-3.5 animate-pulse" />}
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      <span className="text-xs tracking-tight font-normal opacity-70">remaining</span>
    </div>
  );
}
