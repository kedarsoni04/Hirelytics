"use client";

import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Video,
  CheckCircle2,
  Sparkles,
  Loader2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface ScheduledInterview {
  id: string;
  application_id: string;
  student_id: string | null;
  student_name: string;
  college?: string | null;
  branch?: string | null;
  drive_id: string | null;
  drive_title: string;
  scheduled_at: string | null;
  completed_at: string | null;
  status: "scheduled" | "completed";
  ai_score?: number | null;
}

interface CandidateItem {
  application_id: string;
  student_id: string;
  name: string;
  college?: string;
  branch?: string;
  drive_title: string;
  aiScore?: number;
  initials: string;
}

export default function InterviewSchedulerPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateItem | null>(null);
  
  const [scheduled, setScheduled] = useState<ScheduledInterview[]>([]);
  const [pendingCandidates, setPendingCandidates] = useState<CandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [timeSlot, setTimeSlot] = useState("10:00 AM");
  const [interviewNotes, setInterviewNotes] = useState("");

  const currentMonthStr = currentDate.toLocaleString("default", { month: "long", year: "numeric" });
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const startingDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const loadData = async () => {
    try {
      setLoading(true);
      const [scheduledRes, drivesRes] = await Promise.all([
        api.getCompanyScheduledInterviews().catch(() => []),
        api.getMyCompanyDrives().catch(() => []),
      ]);

      setScheduled(scheduledRes || []);

      // Fetch candidates from company drives
      const candidateList: CandidateItem[] = [];
      const scheduledAppIds = new Set((scheduledRes || []).map((s: ScheduledInterview) => s.application_id));

      for (const drive of (drivesRes || [])) {
        try {
          const apps = await api.getDriveApplications(drive.id);
          for (const app of apps) {
            const student = app.student;
            if (student) {
              const name = student.full_name || "Applicant";
              const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "ST";
              
              // If not already scheduled, or shortlisted/ai_interview
              if (!scheduledAppIds.has(app.id)) {
                candidateList.push({
                  application_id: app.id,
                  student_id: student.id,
                  name,
                  college: student.college || "",
                  branch: student.branch || "",
                  drive_title: drive.title,
                  aiScore: 85,
                  initials,
                });
              }
            }
          }
        } catch (e) {
          // ignore individual drive failures
        }
      }

      setPendingCandidates(candidateList);
    } catch (err) {
      console.error("Failed to load interviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openScheduler = (candidate: CandidateItem) => {
    setSelectedCandidate(candidate);
    setScheduleModalOpen(true);
  };

  const handleSchedule = async () => {
    if (!selectedCandidate) return;

    try {
      setSubmitting(true);
      
      // Parse selected time into ISO string
      const [time, period] = timeSlot.split(" ");
      const [hoursStr, minutesStr] = time.split(":");
      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      const scheduleDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate, hours, minutes);

      await api.scheduleInterview({
        application_id: selectedCandidate.application_id,
        scheduled_at: scheduleDate.toISOString(),
        notes: interviewNotes,
      });

      setScheduleModalOpen(false);
      setSelectedCandidate(null);
      setInterviewNotes("");
      
      // Refresh list
      await loadData();
    } catch (error) {
      console.error("Failed to schedule interview:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Filter scheduled interviews for the selected calendar day
  const interviewsForSelectedDate = scheduled.filter((item) => {
    if (!item.scheduled_at) return false;
    const d = new Date(item.scheduled_at);
    return (
      d.getDate() === selectedDate &&
      d.getMonth() === currentDate.getMonth() &&
      d.getFullYear() === currentDate.getFullYear()
    );
  });

  // Set of dates that have scheduled interviews this month
  const datesWithInterviews = new Set(
    scheduled
      .filter((item) => {
        if (!item.scheduled_at) return false;
        const d = new Date(item.scheduled_at);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      })
      .map((item) => new Date(item.scheduled_at!).getDate())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Interview Scheduler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your availability and schedule HR / technical rounds for candidate applications.
          </p>
        </div>
        <Button onClick={loadData} variant="outline" className="gap-2 text-xs">
          <CalendarIcon className="size-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column: Calendar & Scheduled ── */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Calendar Widget */}
          <div className="overflow-x-auto pb-2 -mx-6 px-6 lg:mx-0 lg:px-0">
            <Card className="card-shadow border-border/60 min-w-[500px]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground">{currentMonthStr}</h2>
                <div className="flex items-center gap-1">
                  <Button onClick={prevMonth} variant="ghost" size="icon" className="size-7"><ChevronLeft className="size-4" /></Button>
                  <Button onClick={nextMonth} variant="ghost" size="icon" className="size-7"><ChevronRight className="size-4" /></Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <span key={day} className="text-xs tracking-tight font-semibold text-muted-foreground uppercase">{day}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10 rounded-lg bg-transparent" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const date = i + 1;
                  const isSelected = selectedDate === date;
                  const isToday =
                    date === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear();
                  const hasInterviews = datesWithInterviews.has(date);

                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`relative h-10 rounded-lg text-sm font-medium transition-colors flex items-center justify-center
                        ${isSelected ? "bg-[#4F46E5] text-white font-bold" : "hover:bg-muted text-foreground"}
                        ${isToday && !isSelected ? "text-[#4F46E5] font-bold border border-[#4F46E5]/40" : ""}
                      `}
                    >
                      {date}
                      {hasInterviews && !isSelected && (
                        <span className="absolute bottom-1.5 size-1.5 rounded-full bg-[#8B5CF6]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Scheduled Interviews List */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Clock className="size-4 text-[#4F46E5]" /> Scheduled for {currentMonthStr.split(" ")[0]} {selectedDate}
            </h3>
            <div className="space-y-3">
              {interviewsForSelectedDate.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-border bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground">No interviews scheduled for this date.</p>
                </div>
              ) : (
                interviewsForSelectedDate.map((interview) => {
                  const timeFormatted = interview.scheduled_at
                    ? new Date(interview.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "TBD";

                  return (
                    <Card key={interview.id} className="border-border/60 hover:border-[#4F46E5]/40 transition-colors">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
                            <Video className="size-4 text-[#4F46E5]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{interview.student_name}</p>
                            <p className="text-xs tracking-tight text-muted-foreground mt-0.5">
                              {interview.drive_title} {interview.college ? `· ${interview.college}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{timeFormatted}</p>
                          <p className="text-xs tracking-tight text-muted-foreground mt-0.5 capitalize">
                            {interview.status}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Candidates to Schedule ── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Candidates Awaiting Interview</h2>
            <span className="text-xs tracking-tight font-semibold bg-muted px-2 py-0.5 rounded-full">{pendingCandidates.length} Candidates</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {pendingCandidates.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-border bg-muted/20 text-center">
                <User className="size-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-foreground">No pending candidates</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All current drive applicants have been scheduled or evaluated.
                </p>
              </div>
            ) : (
              pendingCandidates.map((c) => (
                <Card key={c.application_id} className="border-border/60 bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="size-9 shrink-0">
                          <AvatarFallback
                            className="text-xs tracking-tight font-bold text-white shadow-inner"
                            style={{ background: `hsl(${(c.name.charCodeAt(0) * 47) % 360}, 65%, 50%)` }}
                          >
                            {c.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
                          <p className="text-xs tracking-tight text-muted-foreground truncate">
                            {c.drive_title} {c.college ? `· ${c.college}` : ""}
                          </p>
                        </div>
                      </div>
                      {c.aiScore && (
                        <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded bg-[#EDE9FE] text-[#5B21B6] text-xs tracking-tight font-bold">
                          <Sparkles className="size-2.5" /> {c.aiScore}%
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => openScheduler(c)}
                        size="sm"
                        className="flex-1 h-8 text-xs bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#E0E7FF] font-semibold"
                      >
                        <CalendarIcon className="size-3.5 mr-1.5" /> Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── Scheduling Modal ── */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="sm:max-w-md p-6 gap-6">
          <DialogHeader>
            <DialogTitle className="text-lg">Schedule Interview</DialogTitle>
            <DialogDescription className="text-xs">
              Select a date and time slot for <strong className="text-foreground">{selectedCandidate?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Date</Label>
                <div className="h-9 px-3 rounded-md border border-input bg-muted/50 flex items-center text-sm font-medium text-foreground">
                  {currentMonthStr.split(" ")[0]} {selectedDate}, {currentDate.getFullYear()}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Time Slot</Label>
                <select 
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option>10:00 AM</option>
                  <option>11:30 AM</option>
                  <option>02:00 PM</option>
                  <option>03:30 PM</option>
                  <option>04:30 PM</option>
                  <option>06:00 PM</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Interview Type</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <div className="size-8 rounded bg-[#EEF2FF] flex items-center justify-center shrink-0">
                  <Video className="size-4 text-[#4F46E5]" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Video Interview</p>
                  <p className="text-xs tracking-tight text-muted-foreground">Automated notification and meeting entry will be generated.</p>
                </div>
                <CheckCircle2 className="size-4 text-[#10B981] ml-auto" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Message to Candidate (Optional)</Label>
              <Input
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                placeholder="Add a note..."
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => setScheduleModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={handleSchedule}
              className="brand-gradient text-white text-xs font-semibold"
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
