"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles, X, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";

export default function BadgeShowcase() {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-6">Badges & Tags</h2>
      <div className="space-y-6">

        {/* Status badges */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Status Badges</p>
          <div className="flex flex-wrap gap-3 items-center">
            <Badge variant="default">Default</Badge>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D1FAE5] text-[#065F46]">
              <CheckCircle2 className="size-3" />
              Shortlisted
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E]">
              <Clock className="size-3" />
              Under Review
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFE4E6] text-[#9F1239]">
              <XCircle className="size-3" />
              Rejected
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              Draft
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEF2FF] text-[#3730A3]">
              Applied
            </span>
          </div>
        </div>

        {/* AI Badges — violet accent with sparkle */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">AI Badges (Violet Accent)</p>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ai-gradient text-white ai-glow">
              <Sparkles className="size-3" />
              AI Analyzed
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EDE9FE] text-[#5B21B6]">
              <Sparkles className="size-3" />
              AI Score: 87
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EDE9FE] text-[#5B21B6]">
              <Sparkles className="size-3" />
              Strong Match
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EDE9FE] text-[#5B21B6]">
              <Sparkles className="size-3" />
              AI Screened
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-[#C4B5FD] text-[#6D28D9] bg-white">
              <Sparkles className="size-3" />
              AI Recommended
            </span>
          </div>
        </div>

        {/* Role / skill tags */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Role & Skill Tags</p>
          <div className="flex flex-wrap gap-2 items-center">
            {["Software Engineer", "Data Analyst", "Product Manager", "UI/UX Designer", "DevOps", "ML Engineer"].map(
              (tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent text-accent-foreground border border-border hover:bg-accent/80 transition-colors cursor-default"
                >
                  {tag}
                  <button className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="size-3" />
                  </button>
                </span>
              )
            )}
          </div>
        </div>

        {/* Dot status indicators */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Dot Indicators</p>
          <div className="flex flex-wrap gap-4 items-center">
            {[
              { label: "Live", color: "#10B981" },
              { label: "Upcoming", color: "#F59E0B" },
              { label: "Closed", color: "#94A3B8" },
              { label: "Draft", color: "#CBD5E1" },
            ].map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1.5 text-xs text-foreground">
                <span
                  className="size-2 rounded-full shrink-0 animate-pulse"
                  style={{ backgroundColor: item.color, animationPlayState: item.label === "Live" ? "running" : "paused" }}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
