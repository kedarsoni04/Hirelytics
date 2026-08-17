"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";

interface CountdownTimerProps {
  initialSeconds: number;
}

export default function CountdownTimer({ initialSeconds }: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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
