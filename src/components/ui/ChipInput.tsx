"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChipInputProps {
  label?: string;
  placeholder?: string;
  chips: string[];
  onChange: (chips: string[]) => void;
  suggestions?: string[];
  className?: string;
}

export default function ChipInput({
  label,
  placeholder = "Type and press Enter…",
  chips,
  onChange,
  suggestions = [],
  className,
}: ChipInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addChip = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !chips.includes(trimmed)) {
      onChange([...chips, trimmed]);
    }
    setInputValue("");
  };

  const removeChip = (chip: string) => {
    onChange(chips.filter((c) => c !== chip));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(inputValue);
    } else if (e.key === "Backspace" && !inputValue && chips.length > 0) {
      onChange(chips.slice(0, -1));
    }
  };

  const visibleSuggestions = suggestions.filter(
    (s) => !chips.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <p className="text-xs font-medium text-foreground">{label}</p>
      )}

      {/* Input area */}
      <div
        className="min-h-[42px] flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-all cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EEF2FF] border border-[#4F46E5]/20 text-[#3730A3] text-xs font-medium"
          >
            {chip}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeChip(chip);
              }}
              className="text-[#4F46E5] hover:text-[#1e1b4b] transition-colors"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={chips.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-xs outline-none placeholder:text-muted-foreground h-5"
        />
      </div>

      {/* Suggestions */}
      {visibleSuggestions.length > 0 && inputValue && (
        <div className="flex flex-wrap gap-1.5">
          {visibleSuggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addChip(s)}
              className="px-2 py-0.5 rounded-md border border-dashed border-border text-xs tracking-tight text-muted-foreground hover:border-[#4F46E5] hover:text-[#4F46E5] hover:bg-[#EEF2FF] transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {/* Quick-add suggestions (always visible when no input) */}
      {suggestions.length > 0 && !inputValue && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions
            .filter((s) => !chips.includes(s))
            .slice(0, 6)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addChip(s)}
                className="px-2 py-0.5 rounded-md border border-dashed border-border text-xs tracking-tight text-muted-foreground hover:border-[#4F46E5] hover:text-[#4F46E5] hover:bg-[#EEF2FF] transition-colors"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
