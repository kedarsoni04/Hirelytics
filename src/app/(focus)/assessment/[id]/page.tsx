"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import OptionCard from "@/components/assessment/OptionCard";
import QuestionPalette from "@/components/assessment/QuestionPalette";
import CountdownTimer from "@/components/assessment/CountdownTimer";
import { assessmentMeta, sampleQuestion, questionPalette } from "@/lib/mock-data";

export default function AssessmentPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFlagged, setIsFlagged] = useState(questionPalette[sampleQuestion.number] === "flagged");

  const handleToggleFlag = () => {
    setIsFlagged(!isFlagged);
  };

  return (
    <div className="flex h-full">
      {/* ── Main Question Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top contextual bar */}
        <div className="h-14 border-b border-border bg-white px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Question {assessmentMeta.currentQuestion} <span className="text-muted-foreground font-normal">of {assessmentMeta.totalQuestions}</span>
              </p>
              <p className="text-xs tracking-tight text-muted-foreground uppercase tracking-widest mt-0.5">{sampleQuestion.section}</p>
            </div>
            <div className="h-6 w-px bg-border mx-2" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs tracking-tight font-medium bg-[#EEF2FF] text-[#3730A3]">
              <span className="size-1.5 rounded-full bg-[#4F46E5]" />
              {sampleQuestion.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-xs tracking-tight font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
              <ShieldCheck className="size-3.5" /> Proctoring Active
            </span>
            <CountdownTimer initialSeconds={assessmentMeta.initialSecondsRemaining} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 max-w-4xl w-full mx-auto space-y-8">
          {/* Question text */}
          <div className="prose prose-sm max-w-none text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:border-border">
            {sampleQuestion.text.split("\n\n").map((para, i) => {
              if (para.startsWith("    ")) {
                // Code block simulation
                return (
                  <pre key={i} className="p-4 rounded-lg mt-4 mb-4">
                    <code>{para}</code>
                  </pre>
                );
              }
              return (
                <p key={i} className="text-base leading-relaxed mb-4 text-[#334155]">
                  {para}
                </p>
              );
            })}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {sampleQuestion.options.map((opt) => (
              <OptionCard
                key={opt.id}
                option={opt}
                selected={selectedOption === opt.id}
                onSelect={setSelectedOption}
              />
            ))}
          </div>
        </div>

        {/* Bottom controls */}
        <div className="h-16 border-t border-border bg-white px-8 flex items-center justify-between shrink-0 sticky bottom-0 z-10">
          <Button variant="outline" className="gap-2 text-xs">
            <ChevronLeft className="size-4" /> Previous
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className={`gap-2 text-xs transition-colors ${
                isFlagged ? "border-[#F59E0B] bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A] hover:text-[#78350F]" : ""
              }`}
              onClick={handleToggleFlag}
            >
              <Flag className={`size-4 ${isFlagged ? "fill-[#F59E0B]" : ""}`} />
              {isFlagged ? "Unflag Question" : "Flag for Review"}
            </Button>
            <Button className="brand-gradient text-white gap-2 px-6 text-xs hover:opacity-90 transition-opacity font-semibold">
              Save & Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Sidebar (Palette) ── */}
      <div className="w-80 bg-white border-l border-border flex flex-col shrink-0">
        <div className="p-5 border-b border-border shrink-0">
          <h2 className="text-sm font-bold text-foreground truncate">{assessmentMeta.role}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{assessmentMeta.company}</p>
        </div>
        <div className="p-5 flex-1 overflow-y-auto">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-4 text-muted-foreground">Question Palette</h3>
          <QuestionPalette
            total={assessmentMeta.totalQuestions}
            current={assessmentMeta.currentQuestion}
            statuses={questionPalette}
            onJump={(n) => console.log("Jump to", n)}
          />
        </div>
        <div className="p-5 border-t border-border shrink-0">
          <Button variant="destructive" className="w-full text-xs font-bold" onClick={() => alert("Submit Assessment")}>
            Submit Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
