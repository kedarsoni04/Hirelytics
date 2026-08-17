"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckableCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  alwaysOn?: boolean; // e.g. Resume Screening is mandatory
}

export default function CheckableCard({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled = false,
  alwaysOn = false,
}: CheckableCardProps) {
  const isChecked = alwaysOn || checked;

  return (
    <button
      type="button"
      disabled={disabled || alwaysOn}
      onClick={() => !alwaysOn && onChange(!checked)}
      className={cn(
        "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isChecked
          ? "border-[#4F46E5] bg-[#EEF2FF]"
          : "border-border bg-card hover:border-[#818CF8] hover:bg-accent/30",
        (disabled || alwaysOn) && "cursor-default"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
          isChecked ? "bg-[#4F46E5]" : "bg-muted"
        )}
      >
        <Icon
          className={cn("size-5", isChecked ? "text-white" : "text-muted-foreground")}
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm font-semibold",
              isChecked ? "text-[#1e1b4b]" : "text-foreground"
            )}
          >
            {title}
          </p>
          {alwaysOn && (
            <span className="text-xs tracking-tight font-medium px-1.5 py-0.5 rounded-full bg-[#4F46E5]/10 text-[#4F46E5]">
              Required
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Checkbox indicator */}
      <div
        className={cn(
          "size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all mt-0.5",
          isChecked
            ? "bg-[#4F46E5] border-[#4F46E5]"
            : "border-border bg-background"
        )}
      >
        {isChecked && <Check className="size-3 text-white" strokeWidth={3} />}
      </div>
    </button>
  );
}
