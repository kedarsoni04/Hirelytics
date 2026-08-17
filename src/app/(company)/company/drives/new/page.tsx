"use client";

import { useState } from "react";
import {
  FileText,
  MapPin,
  IndianRupee,
  Users,
  GraduationCap,
  ListChecks,
  Video,
  Sparkles,
  MessageSquare,
  ClipboardCheck,
  Save,
  Send,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CheckableCard from "@/components/ui/CheckableCard";
import ChipInput from "@/components/ui/ChipInput";

const BRANCH_SUGGESTIONS = [
  "CSE", "ECE", "IT", "EEE", "Mechanical", "Civil",
  "Chemical", "Aerospace", "Biotechnology", "Mathematics",
];

const LOCATION_SUGGESTIONS = ["Bangalore", "Hyderabad", "Pune", "Mumbai", "Delhi", "Chennai", "Remote"];

const selectionStages = [
  {
    id: "resume",
    icon: FileText,
    title: "Resume Screening",
    description: "AI screens all resumes against job requirements. Mandatory for all drives.",
    alwaysOn: true,
  },
  {
    id: "assessment",
    icon: ClipboardCheck,
    title: "Online Assessment",
    description: "Aptitude, coding, or domain-specific test proctored in-browser.",
    alwaysOn: false,
  },
  {
    id: "ai_interview",
    icon: Video,
    title: "AI Video Interview",
    description: "Asynchronous AI-evaluated video interview round for shortlisted candidates.",
    alwaysOn: false,
  },
  {
    id: "hr_round",
    icon: MessageSquare,
    title: "Final HR Round",
    description: "Live video call with recruiter. Schedule directly from the platform.",
    alwaysOn: false,
  },
];

// ── Section wrapper ───────────────────────────────────────────────────────────

function FormSection({
  step,
  icon: Icon,
  title,
  description,
  children,
}: {
  step: number;
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="card-shadow border-border/60">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="size-9 rounded-xl brand-gradient flex items-center justify-center text-white text-sm font-bold shrink-0">
            {step}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">{title}</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PostDrivePage() {
  const [branches, setBranches] = useState<string[]>(["CSE", "IT", "ECE"]);
  const [backlogAllowed, setBacklogAllowed] = useState<string[]>(["0"]);
  const [stages, setStages] = useState<Record<string, boolean>>({
    resume: true,
    assessment: true,
    ai_interview: true,
    hr_round: false,
  });

  const toggleStage = (id: string, val: boolean) => {
    setStages((s) => ({ ...s, [id]: val }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Post a New Drive</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fill in the details below. You can save as a draft and publish later.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <span className="text-[#4F46E5] font-semibold">1 Role</span>
          <ChevronRight className="size-3.5" />
          <span>2 Eligibility</span>
          <ChevronRight className="size-3.5" />
          <span>3 JD</span>
          <ChevronRight className="size-3.5" />
          <span>4 Process</span>
        </div>
      </div>

      {/* ── Step 1: Role Details ── */}
      <FormSection step={1} icon={FileText} title="Role Details" description="Basic information about the position.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2 space-y-2">
            <Label className="text-xs">Job Title *</Label>
            <Input placeholder="e.g. Software Engineer — Intern" className="h-10 text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Employment Type *</Label>
            <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring">
              <option>Internship</option>
              <option>Full Time</option>
              <option>Part Time</option>
              <option>Contract</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Number of Openings *</Label>
            <Input type="number" placeholder="e.g. 25" className="h-10 text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <IndianRupee className="size-3.5" /> Package / Stipend *
            </Label>
            <Input placeholder="e.g. ₹80,000/mo or ₹24 LPA" className="h-10 text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <MapPin className="size-3.5" /> Location *
            </Label>
            <Input placeholder="e.g. Bangalore, Remote" className="h-10 text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <Users className="size-3.5" /> Application Deadline *
            </Label>
            <Input type="date" className="h-10 text-sm" />
          </div>
        </div>
      </FormSection>

      {/* ── Step 2: Eligibility ── */}
      <FormSection step={2} icon={GraduationCap} title="Eligibility Criteria" description="Define who can apply. These criteria are used for AI pre-screening.">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Minimum CGPA *</Label>
              <Input type="number" step="0.1" min="0" max="10" placeholder="e.g. 7.5" className="h-10 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Graduation Year *</Label>
              <select className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring">
                <option>2025</option>
                <option>2026</option>
                <option>2027</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Max Active Backlogs</Label>
              <Input type="number" min="0" placeholder="0 = no backlogs" className="h-10 text-sm" />
            </div>
          </div>

          <ChipInput
            label="Eligible Branches *"
            chips={branches}
            onChange={setBranches}
            suggestions={BRANCH_SUGGESTIONS}
            placeholder="Type branch and press Enter…"
          />

          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#EEF2FF] border border-indigo-100">
            <Info className="size-4 text-[#4F46E5] shrink-0 mt-0.5" />
            <p className="text-xs text-[#3730A3] leading-relaxed">
              AI will automatically screen candidates based on these criteria and rank them by match score.
            </p>
          </div>
        </div>
      </FormSection>

      {/* ── Step 3: Job Description ── */}
      <FormSection step={3} icon={ListChecks} title="Job Description" description="Describe the role, responsibilities, and required skills. Rich text supported.">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Role Overview</Label>
            <Textarea
              placeholder="Describe what the candidate will be working on, team culture, and the impact of the role…"
              className="min-h-[120px] resize-none text-sm leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Required Skills & Qualifications</Label>
            <Textarea
              placeholder="• Strong fundamentals in Data Structures and Algorithms&#10;• Experience with at least one backend language (Go, Java, Python)&#10;• Exposure to distributed systems…"
              className="min-h-[100px] resize-none text-sm leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Nice to Have</Label>
            <Textarea
              placeholder="• Open source contributions&#10;• Prior internship experience…"
              className="min-h-[72px] resize-none text-sm leading-relaxed"
            />
          </div>
        </div>
      </FormSection>

      {/* ── Step 4: Selection Process ── */}
      <FormSection step={4} icon={Sparkles} title="Selection Process" description="Choose which stages to include. Resume Screening is always active.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {selectionStages.map((stage) => (
            <CheckableCard
              key={stage.id}
              icon={stage.icon}
              title={stage.title}
              description={stage.description}
              checked={stages[stage.id]}
              onChange={(val) => toggleStage(stage.id, val)}
              alwaysOn={stage.alwaysOn}
            />
          ))}
        </div>
      </FormSection>

      {/* ── Action buttons ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <p className="text-xs text-muted-foreground">
          All fields marked * are required before publishing.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 text-xs">
            <Save className="size-3.5" /> Save as Draft
          </Button>
          <Button className="brand-gradient text-white gap-2 text-xs hover:opacity-90 transition-opacity font-bold px-6">
            <Send className="size-3.5" /> Publish Drive
          </Button>
        </div>
      </div>

    </div>
  );
}
