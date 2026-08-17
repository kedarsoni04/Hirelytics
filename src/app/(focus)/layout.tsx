import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: {
    template: "%s — Hirelytics Focus",
    default: "Hirelytics Focus",
  },
  description: "Distraction-free environment for assessments and interviews.",
};

export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Very minimal top bar */}
      <header className="h-12 bg-white border-b border-border flex items-center px-6 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-lg brand-gradient flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">Hirelytics</span>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
