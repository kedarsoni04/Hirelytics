"use client";

import { cn } from "@/lib/utils";
import type { QuestionStatus } from "@/lib/mock-data";
import { Flag } from "lucide-react";

interface QuestionPaletteProps {
  total: number;
  current: number;
  statuses: Record<number, QuestionStatus>;
  onJump: (n: number) => void;
}

const config = {
  answered: {
    base: "bg-[#4F46E5] text-white border-[#4F46E5]",
    label: "Answered",
    dot: "bg-[#4F46E5]",
  },
  unanswered: {
    base: "bg-white text-muted-foreground border-border hover:border-[#818CF8] hover:text-[#4F46E5]",
    label: "Not Answered",
    dot: "bg-border",
  },
  flagged: {
    base: "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]",
    label: "Flagged",
    dot: "bg-[#F59E0B]",
  },
};

export default function QuestionPalette({ total, current, statuses, onJump }: QuestionPaletteProps) {
  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(config) as [QuestionStatus, typeof config.answered][]).map(([status, cfg]) => (
          <span key={status} className="inline-flex items-center gap-1.5 text-xs tracking-tight text-muted-foreground">
            <span className={`size-2 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-xs tracking-tight text-muted-foreground">
          <span className="size-2 rounded-full bg-[#6366F1] ring-2 ring-[#4F46E5]/30" />
          Current
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const isCurrent = n === current;
          const status = statuses[n] ?? "unanswered";
          const cfg = config[status];

          return (
            <button
              key={n}
              onClick={() => onJump(n)}
              title={`Question ${n} — ${cfg.label}`}
              className={cn(
                "relative h-8 w-full rounded-lg border text-xs font-semibold transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isCurrent
                  ? "bg-[#4F46E5] text-white border-[#4F46E5] ring-2 ring-[#4F46E5]/30 scale-105"
                  : cfg.base
              )}
            >
              {n}
              {status === "flagged" && !isCurrent && (
                <Flag className="absolute -top-1 -right-1 size-2.5 text-[#F59E0B] fill-[#F59E0B]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs tracking-tight text-muted-foreground pt-1 border-t border-border">
        <span>{Object.values(statuses).filter(s => s === "answered").length} answered</span>
        <span>{Object.values(statuses).filter(s => s === "unanswered").length + 1} remaining</span>
        <span>{Object.values(statuses).filter(s => s === "flagged").length} flagged</span>
      </div>
    </div>
  );
}
