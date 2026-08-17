"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  FileText,
  Mail,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { initialPipeline } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type StageKey = keyof typeof initialPipeline;

const STAGES: { id: StageKey; title: string; color: string; bg: string }[] = [
  { id: "shortlisted", title: "Shortlisted", color: "#4F46E5", bg: "#EEF2FF" },
  { id: "interviewed", title: "Interviewed", color: "#F59E0B", bg: "#FEF3C7" },
  { id: "offered", title: "Offer Extended", color: "#10B981", bg: "#D1FAE5" },
  { id: "hired", title: "Hired", color: "#0F172A", bg: "#F3F4F6" },
];

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState(initialPipeline);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<typeof initialPipeline.shortlisted[0] | null>(null);

  const moveCandidate = (candidateId: string, fromStage: StageKey, toStage: StageKey) => {
    setPipeline((prev) => {
      const candidate = prev[fromStage].find((c) => c.id === candidateId);
      if (!candidate) return prev;
      return {
        ...prev,
        [fromStage]: prev[fromStage].filter((c) => c.id !== candidateId),
        [toStage]: [...prev[toStage], candidate],
      };
    });
  };

  const handleGenerateOffer = (candidate: typeof initialPipeline.shortlisted[0]) => {
    setSelectedCandidate(candidate);
    setOfferModalOpen(true);
  };

  const confirmOffer = () => {
    setOfferModalOpen(false);
    // In a real app, this would generate a PDF and maybe trigger an email
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Offer Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage candidates through the final stages of the hiring process.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search pipeline..." className="pl-9 h-9" />
          </div>
          <Button variant="outline" className="h-9 gap-2">
            <Plus className="size-4" /> Add Candidate
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory">
        <div className="flex h-full gap-6 min-w-max pb-4 px-1">
          {STAGES.map((stage) => (
            <div key={stage.id} className="w-80 shrink-0 snap-center flex flex-col h-full bg-muted/30 rounded-2xl border border-border/50 p-4">
              
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h2 className="text-sm font-bold text-foreground">{stage.title}</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {pipeline[stage.id].length}
                  </span>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
                {pipeline[stage.id].map((candidate) => (
                  <Card key={candidate.id} className="card-shadow border-border/60 hover:border-[#4F46E5]/40 transition-colors cursor-grab active:cursor-grabbing">
                    <CardContent className="p-4 space-y-4">
                      
                      {/* Candidate Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="size-10 shrink-0">
                            <AvatarFallback
                              className="text-xs font-bold text-white shadow-inner"
                              style={{ background: `hsl(${(candidate.id.charCodeAt(1) * 37) % 360}, 65%, 50%)` }}
                            >
                              {candidate.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{candidate.name}</p>
                            <p className="text-xs tracking-tight text-muted-foreground truncate font-medium">{candidate.role}</p>
                          </div>
                        </div>
                        <button className="text-muted-foreground hover:text-foreground shrink-0">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </div>

                      {/* Tags & Score */}
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EDE9FE] text-[#5B21B6] text-xs tracking-tight font-bold">
                          <Sparkles className="size-2.5" /> {candidate.aiScore}% Match
                        </span>
                        {stage.id === "offered" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-xs tracking-tight font-bold">
                            <Clock className="size-2.5" /> Pending Accept
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border/50">
                        {stage.id === "shortlisted" && (
                          <Button size="sm" onClick={() => moveCandidate(candidate.id, "shortlisted", "interviewed")} className="flex-1 h-8 text-xs bg-muted text-foreground hover:bg-muted/80">
                            Move to Interview
                          </Button>
                        )}
                        {stage.id === "interviewed" && (
                          <Button size="sm" onClick={() => moveCandidate(candidate.id, "interviewed", "offered")} className="flex-1 h-8 text-xs brand-gradient text-white font-semibold">
                            Move to Offer
                          </Button>
                        )}
                        {stage.id === "offered" && (
                          <>
                            <Button size="sm" onClick={() => handleGenerateOffer(candidate)} variant="outline" className="flex-1 h-8 text-xs gap-1.5 text-[#4F46E5] border-[#4F46E5]/30 hover:bg-[#EEF2FF]">
                              <FileText className="size-3" /> Offer Letter
                            </Button>
                            <Button size="sm" onClick={() => moveCandidate(candidate.id, "offered", "hired")} className="flex-1 h-8 text-xs bg-emerald-600 text-white hover:bg-emerald-700">
                              Mark Hired
                            </Button>
                          </>
                        )}
                        {stage.id === "hired" && (
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs text-emerald-700 border-emerald-200 bg-emerald-50 pointer-events-none">
                            <CheckCircle2 className="size-3.5 mr-1" /> Onboarding
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {pipeline[stage.id].length === 0 && (
                  <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl">
                    <p className="text-xs text-muted-foreground font-medium">Drop candidates here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Generate Offer Modal ── */}
      <Dialog open={offerModalOpen} onOpenChange={setOfferModalOpen}>
        <DialogContent className="sm:max-w-md p-6 gap-6">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <FileText className="size-5 text-[#4F46E5]" />
              Generate Offer Letter
            </DialogTitle>
            <DialogDescription className="text-xs">
              Drafting offer for <strong className="text-foreground">{selectedCandidate?.name}</strong>. A PDF will be generated and sent via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Role</Label>
                <Input defaultValue={selectedCandidate?.role} className="h-9 text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Package / CTC</Label>
                <Input defaultValue="₹24,00,000" className="h-9 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Joining Date</Label>
                <Input type="date" className="h-9 text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Offer Expiry</Label>
                <Input type="date" className="h-9 text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Additional Notes</Label>
              <Input placeholder="e.g. Relocation bonus included..." className="h-9 text-xs" />
            </div>
          </div>

          <DialogFooter className="sm:justify-between gap-2 mt-2">
            <Button type="button" variant="ghost" className="text-xs text-muted-foreground px-2">
              <FileText className="size-4 mr-2" /> Preview PDF
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOfferModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={confirmOffer} className="brand-gradient text-white text-xs font-semibold gap-2">
                <Mail className="size-3.5" /> Send Offer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
