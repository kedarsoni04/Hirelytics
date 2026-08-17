"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Trash2, ChevronRight, Plus, Download } from "lucide-react";

const buttonRows = [
  {
    label: "Primary",
    buttons: [
      { children: "Get Started", variant: "default" as const, size: "default" as const },
      { children: "Get Started", variant: "default" as const, size: "sm" as const },
      { children: "Get Started", variant: "default" as const, size: "lg" as const },
    ],
  },
  {
    label: "Secondary",
    buttons: [
      { children: "View Details", variant: "secondary" as const, size: "default" as const },
      { children: "View Details", variant: "secondary" as const, size: "sm" as const },
      { children: "View Details", variant: "secondary" as const, size: "lg" as const },
    ],
  },
  {
    label: "Outline",
    buttons: [
      { children: "Export CSV", variant: "outline" as const, size: "default" as const },
      { children: "Export CSV", variant: "outline" as const, size: "sm" as const },
      { children: "Export CSV", variant: "outline" as const, size: "lg" as const },
    ],
  },
  {
    label: "Ghost",
    buttons: [
      { children: "Cancel", variant: "ghost" as const, size: "default" as const },
      { children: "Cancel", variant: "ghost" as const, size: "sm" as const },
      { children: "Cancel", variant: "ghost" as const, size: "lg" as const },
    ],
  },
  {
    label: "Destructive",
    buttons: [
      { children: "Delete Drive", variant: "destructive" as const, size: "default" as const },
      { children: "Delete Drive", variant: "destructive" as const, size: "sm" as const },
      { children: "Delete Drive", variant: "destructive" as const, size: "lg" as const },
    ],
  },
];

export default function ButtonShowcase() {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-6">Button Variants</h2>
      <div className="space-y-6">
        {/* Standard variants */}
        {buttonRows.map((row) => (
          <div key={row.label} className="flex items-center gap-4 flex-wrap">
            <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{row.label}</span>
            <div className="flex gap-3 flex-wrap items-center">
              {row.buttons.map((btn, i) => (
                <Button key={i} variant={btn.variant} size={btn.size}>
                  {btn.children}
                </Button>
              ))}
            </div>
          </div>
        ))}

        {/* AI Action button — special violet gradient */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">AI Action</span>
          <div className="flex gap-3 flex-wrap items-center">
            <button className="inline-flex items-center gap-2 h-8 px-3 rounded-lg text-sm font-medium text-white ai-gradient transition-all hover:opacity-90 active:translate-y-px ai-glow">
              <Sparkles className="size-4" />
              Analyze Resume
            </button>
            <button className="inline-flex items-center gap-2 h-7 px-2.5 rounded-lg text-[0.8rem] font-medium text-white ai-gradient transition-all hover:opacity-90 active:translate-y-px">
              <Sparkles className="size-3.5" />
              AI Score
            </button>
            <button className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium text-white ai-gradient transition-all hover:opacity-90 active:translate-y-px ai-glow">
              <Sparkles className="size-4" />
              Run AI Screening
            </button>
          </div>
        </div>

        {/* States */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">States</span>
          <div className="flex gap-3 flex-wrap items-center">
            <Button>
              <Plus className="size-4" />
              Create Drive
            </Button>
            <Button disabled>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </Button>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button variant="destructive" size="icon">
              <Trash2 className="size-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
