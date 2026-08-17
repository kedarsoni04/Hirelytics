"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Video,
  UserCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
import { candidates } from "@/lib/mock-data";

// Generate mock dates for calendar
const today = new Date();
const currentMonthStr = today.toLocaleString("default", { month: "long", year: "numeric" });
const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
const startingDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

// Filter candidates to "shortlisted" for scheduling
const shortlistedCandidates = candidates.filter((c) => c.stage === "shortlisted");

export default function InterviewSchedulerPage() {
  const [selectedDate, setSelectedDate] = useState<number>(today.getDate());
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<typeof candidates[0] | null>(null);
  
  // Mock scheduled interviews state
  const [scheduled, setScheduled] = useState<{ id: string; name: string; date: string; time: string }[]>([
    { id: "i1", name: "Ananya Krishnan", date: `${currentMonthStr.split(" ")[0]} 18, ${today.getFullYear()}`, time: "10:00 AM" },
    { id: "i2", name: "Vikram Nair", date: `${currentMonthStr.split(" ")[0]} 18, ${today.getFullYear()}`, time: "02:30 PM" },
  ]);

  const [timeSlot, setTimeSlot] = useState("10:00 AM");

  const openScheduler = (candidate: typeof candidates[0]) => {
    setSelectedCandidate(candidate);
    setScheduleModalOpen(true);
  };

  const handleSchedule = () => {
    if (selectedCandidate) {
      setScheduled((prev) => [
        ...prev,
        {
          id: `new-${Date.now()}`,
          name: selectedCandidate.name,
          date: `${currentMonthStr.split(" ")[0]} ${selectedDate}, ${today.getFullYear()}`,
          time: timeSlot,
        },
      ]);
      setScheduleModalOpen(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Interview Scheduler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your availability and schedule HR rounds for shortlisted candidates.
          </p>
        </div>
        <Button className="brand-gradient text-white gap-2">
          <CalendarIcon className="size-4" /> Sync Calendar
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
                  <Button variant="ghost" size="icon" className="size-7"><ChevronLeft className="size-4" /></Button>
                  <Button variant="ghost" size="icon" className="size-7"><ChevronRight className="size-4" /></Button>
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
                  const isToday = date === today.getDate();
                  const hasInterviews = date === 18 || date === 22; // Mock indicators

                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`relative h-10 rounded-lg text-sm font-medium transition-colors flex items-center justify-center
                        ${isSelected ? "bg-[#4F46E5] text-white" : "hover:bg-muted text-foreground"}
                        ${isToday && !isSelected ? "text-[#4F46E5] font-bold" : ""}
                      `}
                    >
                      {date}
                      {hasInterviews && !isSelected && (
                        <span className="absolute bottom-1.5 size-1 rounded-full bg-[#8B5CF6]" />
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
              {scheduled.filter(s => s.date.includes(String(selectedDate))).length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-border bg-muted/30 text-center">
                  <p className="text-xs text-muted-foreground">No interviews scheduled for this date.</p>
                </div>
              ) : (
                scheduled.filter(s => s.date.includes(String(selectedDate))).map((interview) => (
                  <Card key={interview.id} className="border-border/60 hover:border-[#4F46E5]/40 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
                          <Video className="size-4 text-[#4F46E5]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{interview.name}</p>
                          <p className="text-xs tracking-tight text-muted-foreground mt-0.5">Technical HR Round</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{interview.time}</p>
                        <p className="text-xs tracking-tight text-muted-foreground mt-0.5">Google Meet</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Candidates to Schedule ── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Pending Scheduling</h2>
            <span className="text-xs tracking-tight font-semibold bg-muted px-2 py-0.5 rounded-full">{shortlistedCandidates.length} Candidates</span>
          </div>

          <div className="space-y-3">
            {shortlistedCandidates.map((c) => (
              <Card key={c.id} className="border-border/60 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback
                          className="text-xs tracking-tight font-bold text-white shadow-inner"
                          style={{ background: `hsl(${(c.id.charCodeAt(1) * 37) % 360}, 65%, 50%)` }}
                        >
                          {c.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{c.name}</p>
                        <p className="text-xs tracking-tight text-muted-foreground truncate">{c.college} · {c.branch}</p>
                      </div>
                    </div>
                    {/* AI Score Badge */}
                    <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded bg-[#EDE9FE] text-[#5B21B6] text-xs tracking-tight font-bold">
                      <Sparkles className="size-2.5" /> {c.aiScore}%
                    </div>
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
            ))}
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
                  {currentMonthStr.split(" ")[0]} {selectedDate}, {today.getFullYear()}
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
                  <option>04:30 PM</option>
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
                  <p className="text-sm font-semibold">Video Call</p>
                  <p className="text-xs tracking-tight text-muted-foreground">Google Meet link will be generated.</p>
                </div>
                <CheckCircle2 className="size-4 text-[#10B981] ml-auto" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Message to Candidate (Optional)</Label>
              <Input placeholder="Add a note..." className="h-9 text-xs" />
            </div>
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setScheduleModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSchedule} className="brand-gradient text-white text-xs font-semibold">
              Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
