"use client";

import { cn } from "@/lib/utils";
import type { MCQOption } from "@/lib/mock-data";

interface OptionCardProps {
  option: MCQOption;
  selected: boolean;
  onSelect: (id: string) => void;
}

const OPTION_LABELS: Record<string, string> = { a: "A", b: "B", c: "C", d: "D" };

export default function OptionCard({ option, selected, onSelect }: OptionCardProps) {
  return (
    <button
      onClick={() => onSelect(option.id)}
      className={cn(
        "w-full flex items-start gap-4 px-4 py-4 rounded-xl border-2 text-left transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        selected
          ? "border-[#4F46E5] bg-[#EEF2FF]"
          : "border-border bg-card hover:border-[#818CF8] hover:bg-accent/50"
      )}
    >
      {/* Option label bubble */}
      <span
        className={cn(
          "size-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors",
          selected
            ? "bg-[#4F46E5] text-white"
            : "bg-muted text-muted-foreground group-hover:bg-[#C7D2FE] group-hover:text-[#3730A3]"
        )}
      >
        {OPTION_LABELS[option.id]}
      </span>

      {/* Option text */}
      <span
        className={cn(
          "text-sm leading-relaxed pt-1 transition-colors",
          selected ? "text-[#1e1b4b] font-medium" : "text-foreground"
        )}
      >
        {option.text}
      </span>

      {/* Selected indicator */}
      <span className="ml-auto shrink-0 pt-1">
        <span
          className={cn(
            "size-4 rounded-full border-2 flex items-center justify-center transition-all",
            selected ? "border-[#4F46E5]" : "border-border group-hover:border-[#818CF8]"
          )}
        >
          {selected && <span className="size-2 rounded-full bg-[#4F46E5]" />}
        </span>
      </span>
    </button>
  );
}
