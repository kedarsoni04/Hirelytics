"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CheckableCard from "@/components/ui/CheckableCard";
import ChipInput from "@/components/ui/ChipInput";
import { api } from "@/lib/api";

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
  const router = useRouter();

  // ── Form state ──
  const [title, setTitle] = useState("");
  const [employmentType, setEmploymentType] = useState("Internship");
  const [openings, setOpenings] = useState("");
  const [packageStr, setPackageStr] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");

  const [minCgpa, setMinCgpa] = useState("");
  const [gradYear, setGradYear] = useState("2025");
  const [maxBacklogs, setMaxBacklogs] = useState("");
  const [branches, setBranches] = useState<string[]>(["CSE", "IT", "ECE"]);

  const [roleOverview, setRoleOverview] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [niceToHave, setNiceToHave] = useState("");

  const [stages, setStages] = useState<Record<string, boolean>>({
    resume: true,
    assessment: true,
    ai_interview: true,
    hr_round: false,
  });

  // ── Submit state ──
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState<string | null>(null);

  const toggleStage = (id: string, val: boolean) => {
    setStages((s) => ({ ...s, [id]: val }));
  };

  const buildDescription = () => {
    const parts: string[] = [];
    if (roleOverview.trim()) parts.push(roleOverview.trim());
    if (requiredSkills.trim()) parts.push("## Required Skills & Qualifications\n" + requiredSkills.trim());
    if (niceToHave.trim()) parts.push("## Nice to Have\n" + niceToHave.trim());
    return parts.join("\n\n");
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!title.trim()) {
      setError("Job title is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    const selectedStages = selectionStages
      .filter((s) => stages[s.id])
      .map((s) => s.id);

    const payload: Record<string, any> = {
      title: title.trim(),
      description: buildDescription() || null,
      package: packageStr.trim() || null,
      location: location.trim() || null,
      min_cgpa: minCgpa ? parseFloat(minCgpa) : null,
      eligible_branches: branches,
      max_backlogs: maxBacklogs ? parseInt(maxBacklogs) : 0,
      selection_stages: selectedStages,
      deadline: deadline ? new Date(deadline).toISOString() : null,
    };

    try {
      const created = await api.createDrive(payload);

      // If publishing (not draft), immediately PATCH status to live
      if (!asDraft) {
        await api.updateDrive(created.id, { status: "live" });
        setSuccessId(created.id);
      } else {
        setSuccessId(created.id);
      }

      // Navigate to company dashboard after 1.5s
      setTimeout(() => {
        router.push("/company/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create drive");
    } finally {
      setSubmitting(false);
    }
  };

  if (successId) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center py-24 gap-4">
        <div className="size-16 rounded-2xl bg-[#D1FAE5] flex items-center justify-center">
          <CheckCircle2 className="size-8 text-[#10B981]" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Drive created!</h2>
        <p className="text-sm text-muted-foreground">Redirecting to your dashboard\u2026</p>
      </div>
    );
  }

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
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Software Engineer \u2014 Intern"
              className="h-10 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Employment Type *</Label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
            >
              <option>Internship</option>
              <option>Full Time</option>
              <option>Part Time</option>
              <option>Contract</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Number of Openings</Label>
            <Input
              type="number"
              value={openings}
              onChange={(e) => setOpenings(e.target.value)}
              placeholder="e.g. 25"
              className="h-10 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <IndianRupee className="size-3.5" /> Package / Stipend
            </Label>
            <Input
              value={packageStr}
              onChange={(e) => setPackageStr(e.target.value)}
              placeholder="e.g. \u20b980,000/mo or \u20b924 LPA"
              className="h-10 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <MapPin className="size-3.5" /> Location
            </Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bangalore, Remote"
              className="h-10 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <Users className="size-3.5" /> Application Deadline
            </Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
        </div>
      </FormSection>

      {/* ── Step 2: Eligibility ── */}
      <FormSection step={2} icon={GraduationCap} title="Eligibility Criteria" description="Define who can apply. These criteria are used for AI pre-screening.">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Minimum CGPA</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
                placeholder="e.g. 7.5"
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Graduation Year</Label>
              <select
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring"
              >
                <option>2025</option>
                <option>2026</option>
                <option>2027</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Max Active Backlogs</Label>
              <Input
                type="number"
                min="0"
                value={maxBacklogs}
                onChange={(e) => setMaxBacklogs(e.target.value)}
                placeholder="0 = no backlogs"
                className="h-10 text-sm"
              />
            </div>
          </div>

          <ChipInput
            label="Eligible Branches *"
            chips={branches}
            onChange={setBranches}
            suggestions={BRANCH_SUGGESTIONS}
            placeholder="Type branch and press Enter\u2026"
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
      <FormSection step={3} icon={ListChecks} title="Job Description" description="Describe the role, responsibilities, and required skills.">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Role Overview</Label>
            <Textarea
              value={roleOverview}
              onChange={(e) => setRoleOverview(e.target.value)}
              placeholder="Describe what the candidate will be working on, team culture, and the impact of the role\u2026"
              className="min-h-[120px] resize-none text-sm leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Required Skills &amp; Qualifications</Label>
            <Textarea
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              placeholder="&#x2022; Strong fundamentals in Data Structures and Algorithms&#10;&#x2022; Experience with at least one backend language&#10;&#x2022; Exposure to distributed systems\u2026"
              className="min-h-[100px] resize-none text-sm leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Nice to Have</Label>
            <Textarea
              value={niceToHave}
              onChange={(e) => setNiceToHave(e.target.value)}
              placeholder="&#x2022; Open source contributions&#10;&#x2022; Prior internship experience\u2026"
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

      {/* ── Error message ── */}
      {error && (
        <p className="text-xs text-rose-500 text-center">{error}</p>
      )}

      {/* ── Action buttons ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <p className="text-xs text-muted-foreground">
          All fields marked * are required before publishing.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2 text-xs"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
          >
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save as Draft
          </Button>
          <Button
            className="brand-gradient text-white gap-2 text-xs hover:opacity-90 transition-opacity font-bold px-6"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
          >
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Publish Drive
          </Button>
        </div>
      </div>

    </div>
  );
}
