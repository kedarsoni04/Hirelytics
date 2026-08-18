"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Search,
  Sparkles,
  FileText,
  Mail,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  ChevronRight,
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
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type StageKey = "shortlisted" | "interviewed" | "offered" | "hired";

const STAGES: { id: StageKey; title: string; color: string; bg: string; dbStage: string }[] = [
  { id: "shortlisted", title: "Shortlisted", color: "#4F46E5", bg: "#EEF2FF", dbStage: "shortlisted" },
  { id: "interviewed", title: "AI Interview", color: "#F59E0B", bg: "#FEF3C7", dbStage: "ai_interview" },
  { id: "offered", title: "Offer Extended", color: "#10B981", bg: "#D1FAE5", dbStage: "offered" },
  { id: "hired", title: "Hired", color: "#0F172A", bg: "#F3F4F6", dbStage: "hired" },
];

function getInitials(name: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default function PipelinePage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadPipeline = async () => {
    try {
      setLoading(true);
      setError(null);
      const drives = await api.getMyCompanyDrives();
      if (!drives || drives.length === 0) {
        setApplications([]);
        return;
      }
      const appArrays = await Promise.all(
        drives.map((d: any) => api.getDriveApplications(d.id).catch(() => []))
      );
      const allApps = appArrays.flat();
      setApplications(allApps);
    } catch (err: any) {
      console.error("[Pipeline] Load error:", err);
      setError(err.message || "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const moveCandidate = async (appId: string, toDbStage: string) => {
    try {
      setUpdatingId(appId);
      await api.updateApplicationStage(appId, toDbStage);
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, current_stage: toDbStage } : app))
      );
    } catch (err: any) {
      console.error("[Pipeline] Stage update error:", err);
      alert(err.message || "Failed to update stage");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleGenerateOffer = (candidate: any) => {
    setSelectedCandidate(candidate);
    setOfferModalOpen(true);
  };

  const confirmOffer = async () => {
    if (selectedCandidate) {
      await moveCandidate(selectedCandidate.id, "offered");
    }
    setOfferModalOpen(false);
  };

  // Group applications by kanban columns
  const getStageApplications = (stageId: StageKey) => {
    return applications
      .filter((app) => {
        const stage = app.current_stage;
        if (stageId === "shortlisted") {
          return stage === "shortlisted" || stage === "applied" || stage === "resume_screened";
        }
        if (stageId === "interviewed") {
          return stage === "ai_interview" || stage === "assessment" || stage === "hr_round";
        }
        if (stageId === "offered") {
          return stage === "offered" || stage === "offer";
        }
        if (stageId === "hired") {
          return stage === "hired";
        }
        return false;
      })
      .filter((app) => {
        if (!search) return true;
        const name = app.student?.full_name?.toLowerCase() || "";
        const role = app.drive?.title?.toLowerCase() || "";
        const query = search.toLowerCase();
        return name.includes(query) || role.includes(query);
      });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="size-8 animate-spin text-[#4F46E5]" />
        <p className="text-sm text-muted-foreground">Loading recruitment pipeline…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="size-8 text-rose-500" />
            <p className="text-sm font-medium text-rose-700">{error}</p>
            <Button size="sm" variant="outline" onClick={loadPipeline} className="text-xs mt-2">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hiring Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage candidates across your active campus drives in real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search candidate or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Link href="/company/dashboard">
            <Button variant="outline" className="h-9 gap-1.5 text-xs">
              View All Drives
            </Button>
          </Link>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory">
        <div className="flex h-full gap-6 min-w-max pb-4 px-1">
          {STAGES.map((stage) => {
            const stageApps = getStageApplications(stage.id);

            return (
              <div
                key={stage.id}
                className="w-80 shrink-0 snap-center flex flex-col h-full bg-muted/30 rounded-2xl border border-border/50 p-4"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <h2 className="text-sm font-bold text-foreground">{stage.title}</h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {stageApps.length}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
                  {stageApps.map((app) => {
                    const student = app.student || {};
                    const drive = app.drive || {};
                    const initials = getInitials(student.full_name || "Candidate");
                    const isUpdating = updatingId === app.id;

                    return (
                      <Card
                        key={app.id}
                        className="card-shadow border-border/60 hover:border-[#4F46E5]/40 transition-colors"
                      >
                        <CardContent className="p-4 space-y-3">
                          {/* Candidate Info */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="size-10 shrink-0">
                                <AvatarFallback
                                  className="text-xs font-bold text-white shadow-inner"
                                  style={{
                                    background: `hsl(${(app.id.charCodeAt(0) * 37) % 360}, 65%, 50%)`,
                                  }}
                                >
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <Link
                                  href={`/company/drives/${app.drive_id}/candidates/${app.id}`}
                                  className="text-sm font-bold text-foreground hover:text-[#4F46E5] truncate block"
                                >
                                  {student.full_name || "Candidate"}
                                </Link>
                                <p className="text-xs tracking-tight text-muted-foreground truncate font-medium">
                                  {drive.title || "Drive Role"}
                                </p>
                              </div>
                            </div>
                            <Link
                              href={`/company/drives/${app.drive_id}/candidates/${app.id}`}
                              className="text-muted-foreground hover:text-foreground shrink-0 p-1"
                            >
                              <ChevronRight className="size-4" />
                            </Link>
                          </div>

                          {/* CGPA & Branch */}
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {student.cgpa !== null && student.cgpa !== undefined && (
                              <span className="px-1.5 py-0.5 rounded bg-muted font-medium">
                                CGPA: {student.cgpa}
                              </span>
                            )}
                            <span className="truncate">{student.college || student.branch || "Student"}</span>
                          </div>

                          {/* Actions based on column */}
                          <div className="flex gap-2 pt-2 border-t border-border/50">
                            {stage.id === "shortlisted" && (
                              <Button
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => moveCandidate(app.id, "ai_interview")}
                                className="flex-1 h-8 text-xs bg-muted text-foreground hover:bg-muted/80"
                              >
                                {isUpdating ? <Loader2 className="size-3 animate-spin" /> : "Move to Interview"}
                              </Button>
                            )}
                            {stage.id === "interviewed" && (
                              <Button
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => handleGenerateOffer(app)}
                                className="flex-1 h-8 text-xs brand-gradient text-white font-semibold"
                              >
                                {isUpdating ? <Loader2 className="size-3 animate-spin" /> : "Extend Offer"}
                              </Button>
                            )}
                            {stage.id === "offered" && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={isUpdating}
                                  onClick={() => handleGenerateOffer(app)}
                                  variant="outline"
                                  className="flex-1 h-8 text-xs gap-1 text-[#4F46E5] border-[#4F46E5]/30 hover:bg-[#EEF2FF]"
                                >
                                  <FileText className="size-3" /> Offer
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={isUpdating}
                                  onClick={() => moveCandidate(app.id, "hired")}
                                  className="flex-1 h-8 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                  {isUpdating ? <Loader2 className="size-3 animate-spin" /> : "Mark Hired"}
                                </Button>
                              </>
                            )}
                            {stage.id === "hired" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-8 text-xs text-emerald-700 border-emerald-200 bg-emerald-50 pointer-events-none"
                              >
                                <CheckCircle2 className="size-3.5 mr-1" /> Hired
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {stageApps.length === 0 && (
                    <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl">
                      <p className="text-xs text-muted-foreground font-medium">No candidates in this stage</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
              Extending offer to{" "}
              <strong className="text-foreground">{selectedCandidate?.student?.full_name}</strong> for{" "}
              <strong className="text-foreground">{selectedCandidate?.drive?.title}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Role</Label>
                <Input
                  defaultValue={selectedCandidate?.drive?.title || "Software Engineer"}
                  className="h-9 text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Package / CTC</Label>
                <Input
                  defaultValue={selectedCandidate?.drive?.package || "₹24 LPA"}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Additional Notes</Label>
              <Input placeholder="e.g. Standard 15-day joining timeline" className="h-9 text-xs" />
            </div>
          </div>

          <DialogFooter className="sm:justify-between gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOfferModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={confirmOffer}
              className="brand-gradient text-white text-xs font-semibold gap-2"
            >
              <Mail className="size-3.5" /> Extend Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
