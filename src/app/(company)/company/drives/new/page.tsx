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
  Upload,
  FileSpreadsheet,
  Trash2,
  Plus,
  X,
  Check,
  AlertCircle,
  HelpCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import CheckableCard from "@/components/ui/CheckableCard";
import ChipInput from "@/components/ui/ChipInput";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { dispatchDrivesUpdated } from "@/lib/use-nav-counts";

const BRANCH_SUGGESTIONS = [
  "CSE", "ECE", "IT", "EEE", "Mechanical", "Civil",
  "Chemical", "Aerospace", "Biotechnology", "Mathematics",
];

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

interface MCQQuestion {
  question: string;
  options: [string, string, string, string];
  correct_option: number; // 0–3
}

interface RawQuestionInput {
  question?: string;
  options?: string[];
  correct_option?: number;
}

function makeBlankQuestion(): MCQQuestion {
  return { question: "", options: ["", "", "", ""], correct_option: 0 };
}

const OPTION_LABELS = ["A", "B", "C", "D"];

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

  // ── Assessment & AI Question Generator State ──
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [durationMins, setDurationMins] = useState(30);
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiNumQuestions, setAiNumQuestions] = useState(10);
  const [customAiPrompt, setCustomAiPrompt] = useState("");
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [appendMode, setAppendMode] = useState<"replace" | "append">("replace");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "csv", "txt"].includes(ext || "")) {
        setAiError("Please select a .csv, .pdf, or .txt file.");
        return;
      }
      setAiFile(file);
      setAiError(null);
      setAiSuccessMessage(null);
    }
  };

  const handleGenerateAiQuestions = async () => {
    if (!aiFile) {
      setAiError("Please select a CSV or PDF file to upload.");
      return;
    }

    setGeneratingAi(true);
    setAiError(null);
    setAiSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", aiFile);
      formData.append("num_questions", String(aiNumQuestions));

      const promptParts = [
        title ? `Role Title: ${title}` : "",
        buildDescription(),
        customAiPrompt.trim() ? `Instructions: ${customAiPrompt.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      if (promptParts.trim()) {
        formData.append("custom_job_description", promptParts.trim());
      }

      const res = await api.generateAssessmentQuestionsFromFile(formData);
      if (res && Array.isArray(res.questions) && res.questions.length > 0) {
        const mapped: MCQQuestion[] = res.questions.map((q: RawQuestionInput) => ({
          question: q.question || "",
          options: [
            q.options?.[0] || "",
            q.options?.[1] || "",
            q.options?.[2] || "",
            q.options?.[3] || "",
          ],
          correct_option: typeof q.correct_option === "number" ? q.correct_option : 0,
        }));

        if (appendMode === "append") {
          setQuestions((prev) => {
            const nonEmpty = prev.filter(
              (p) => p.question.trim() || p.options.some((o) => o.trim())
            );
            return [...nonEmpty, ...mapped];
          });
          setAiSuccessMessage(`Appended ${mapped.length} AI questions from "${aiFile.name}".`);
        } else {
          setQuestions(mapped);
          setAiSuccessMessage(
            `Successfully generated ${mapped.length} questions from "${aiFile.name}". Review and edit below.`
          );
        }
      } else {
        setAiError("AI could not extract questions from this file. Try another file or format.");
      }
    } catch (err: unknown) {
      console.error("[AI Assessment Gen Error]", err);
      setAiError(err instanceof Error ? err.message : "Failed to generate questions with AI.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const addQuestion = () => setQuestions((prev) => [...prev, makeBlankQuestion()]);

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: "question" | "correct_option", value: string | number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = [...q.options] as [string, string, string, string];
        newOpts[optIdx] = value;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!title.trim()) {
      setError("Job title is required.");
      return;
    }

    // If assessment stage is enabled, validate provided questions (if any)
    const validQuestions = questions.filter((q) => q.question.trim());
    if (stages.assessment && validQuestions.length > 0) {
      for (let i = 0; i < validQuestions.length; i++) {
        const q = validQuestions[i];
        for (let o = 0; o < 4; o++) {
          if (!q.options[o].trim()) {
            setError(`Assessment Question ${i + 1}, Option ${OPTION_LABELS[o]} is required.`);
            return;
          }
        }
      }
    }

    setSubmitting(true);
    setError("");

    const selectedStages = selectionStages
      .filter((s) => stages[s.id])
      .map((s) => s.id);

    const payload: Record<string, unknown> = {
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

      // If assessment stage is active and questions were configured, save assessment now
      if (stages.assessment && validQuestions.length > 0) {
        try {
          await api.createAssessment({
            drive_id: created.id,
            questions: validQuestions.map((q) => ({
              question: q.question.trim(),
              options: q.options.map((o) => o.trim()),
              correct_option: q.correct_option,
            })),
            duration_mins: durationMins,
          });
        } catch (assessErr) {
          console.error("[Create Assessment Error during Drive Posting]", assessErr);
        }
      }

      // If publishing (not draft), immediately PATCH status to live
      if (!asDraft) {
        await api.updateDrive(created.id, { status: "live" });
      }

      setSuccessId(created.id);
      dispatchDrivesUpdated();

      // Navigate to company dashboard after 1.5s
      setTimeout(() => {
        router.push("/company/dashboard");
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create drive");
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
        <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
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
          {stages.assessment && (
            <>
              <ChevronRight className="size-3.5" />
              <span className="text-[#4F46E5] font-semibold">5 Assessment</span>
            </>
          )}
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
              placeholder="e.g. Software Engineer — Intern"
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
              placeholder="e.g. ₹80,000/mo or ₹24 LPA"
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
      <FormSection step={3} icon={ListChecks} title="Job Description" description="Describe the role, responsibilities, and required skills.">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Role Overview</Label>
            <Textarea
              value={roleOverview}
              onChange={(e) => setRoleOverview(e.target.value)}
              placeholder="Describe what the candidate will be working on, team culture, and the impact of the role…"
              className="min-h-[120px] resize-none text-sm leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Required Skills &amp; Qualifications</Label>
            <Textarea
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              placeholder="• Strong fundamentals in Data Structures and Algorithms&#10;• Experience with at least one backend language&#10;• Exposure to distributed systems…"
              className="min-h-[100px] resize-none text-sm leading-relaxed"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Nice to Have</Label>
            <Textarea
              value={niceToHave}
              onChange={(e) => setNiceToHave(e.target.value)}
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

      {/* ── Step 5: Assessment Configuration & AI File Generator (Shown if Online Assessment is active) ── */}
      {stages.assessment && (
        <FormSection
          step={5}
          icon={ClipboardCheck}
          title="Online Assessment & AI Question Generator"
          description="Upload a CSV or PDF file to generate questions automatically with AI, or build questions manually."
        >
          <div className="space-y-6">
            {/* AI Generator Box */}
            <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white shadow-sm">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      AI Question Generator
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                        Auto-Extract from File
                      </span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Upload a CSV or PDF file. AI will extract and formulate MCQs aligned with this drive.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                  className="text-[11px] font-medium text-[#4F46E5] hover:underline flex items-center gap-1 shrink-0"
                >
                  <HelpCircle className="size-3.5" />
                  {showCustomPrompt ? "Hide custom instructions" : "Custom AI instructions"}
                </button>
              </div>

              {/* Optional custom prompt */}
              {showCustomPrompt && (
                <div className="space-y-1.5 p-3 rounded-lg bg-white/80 border border-indigo-100">
                  <Label className="text-[11px] font-semibold text-foreground">
                    Custom Prompt or Specific Topics to Emphasize
                  </Label>
                  <textarea
                    value={customAiPrompt}
                    onChange={(e) => setCustomAiPrompt(e.target.value)}
                    placeholder="e.g. Focus on React hooks, async programming, REST APIs, and database indexing..."
                    rows={2}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
                  />
                </div>
              )}

              {/* Upload Dropzone & Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* File Dropzone */}
                <div className="sm:col-span-7">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.pdf,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {!aiFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white/60 hover:bg-white rounded-lg p-3 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5"
                    >
                      <Upload className="size-5 text-[#4F46E5]" />
                      <div className="text-xs font-medium text-foreground">
                        Click to upload <span className="text-[#4F46E5] font-bold">CSV</span> or <span className="text-[#4F46E5] font-bold">PDF</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Question bank, syllabus, or exam notes (up to 10MB)
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-indigo-200">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {aiFile.name.endsWith(".csv") ? (
                          <FileSpreadsheet className="size-6 text-emerald-600 shrink-0" />
                        ) : (
                          <FileText className="size-6 text-rose-600 shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="text-xs font-semibold text-foreground truncate">{aiFile.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {(aiFile.size / 1024).toFixed(1)} KB • Ready for AI parsing
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAiFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Remove file"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Number of Questions & Mode */}
                <div className="sm:col-span-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Number of Qs</Label>
                    <div className="flex items-center gap-1">
                      {[5, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setAiNumQuestions(num)}
                          className={cn(
                            "px-1.5 py-0.5 text-[10px] rounded font-semibold transition-colors",
                            aiNumQuestions === num
                              ? "bg-[#4F46E5] text-white"
                              : "bg-white text-muted-foreground hover:bg-muted border border-border"
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={aiNumQuestions}
                      onChange={(e) =>
                        setAiNumQuestions(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))
                      }
                      className="h-8 text-xs bg-white"
                    />
                    <select
                      value={appendMode}
                      onChange={(e) => setAppendMode(e.target.value as "replace" | "append")}
                      className="h-8 px-2 rounded-md border border-input bg-white text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="replace">Replace all</option>
                      <option value="append">Append</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Generate Action Button */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-muted-foreground">
                  AI extracts answers or computes the most accurate option.
                </p>
                <Button
                  type="button"
                  onClick={handleGenerateAiQuestions}
                  disabled={generatingAi || !aiFile}
                  size="sm"
                  className="brand-gradient text-white text-xs font-bold gap-1.5 shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {generatingAi ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Analyzing file &amp; generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      Generate Questions with AI
                    </>
                  )}
                </Button>
              </div>

              {/* Feedback messages */}
              {aiSuccessMessage && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>{aiSuccessMessage}</span>
                </div>
              )}
              {aiError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}
            </div>

            {/* Assessment Duration Settings */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-border/60">
              <div className="flex items-center gap-3">
                <Label htmlFor="assessment-duration" className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  Duration (minutes)
                </Label>
                <Input
                  id="assessment-duration"
                  type="number"
                  min={5}
                  max={180}
                  value={durationMins}
                  onChange={(e) => setDurationMins(Math.max(5, parseInt(e.target.value) || 30))}
                  className="w-24 h-8 text-xs bg-background"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Questions configured: <strong className="text-foreground">{questions.length}</strong></span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">4 options per question</span>
              </div>
            </div>

            {/* Questions List & Manual Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Questions Preview &amp; Editor ({questions.length})
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Radio buttons mark the correct answer. You can also modify questions after posting.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                  className="gap-1.5 text-xs border-dashed"
                >
                  <Plus className="size-3.5" />
                  Add Question
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl p-8 text-center bg-muted/10 space-y-2">
                  <ClipboardCheck className="size-8 mx-auto text-muted-foreground/60" />
                  <p className="text-xs font-semibold text-foreground">No questions added yet</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Upload a CSV/PDF above to auto-generate questions, click &quot;Add Question&quot; to write manually, or configure questions later from the Candidates page.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-4 rounded-xl border border-border bg-muted/20 space-y-3 relative group transition-all hover:border-indigo-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="size-6 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] text-xs font-bold flex items-center justify-center">
                            {qIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-foreground">Question {qIdx + 1}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Correct: Option {OPTION_LABELS[q.correct_option]}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(qIdx)}
                          className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Remove question"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Question statement *</Label>
                        <textarea
                          value={q.question}
                          onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                          placeholder="Enter question text here…"
                          rows={2}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {OPTION_LABELS.map((label, oIdx) => {
                          const isCorrect = q.correct_option === oIdx;
                          return (
                            <div
                              key={oIdx}
                              className={cn(
                                "flex items-center gap-2 p-1.5 rounded-lg border transition-colors",
                                isCorrect
                                  ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300/50"
                                  : "bg-background border-border/80"
                              )}
                            >
                              <input
                                type="radio"
                                name={`q-new-${qIdx}-correct`}
                                checked={isCorrect}
                                onChange={() => updateQuestion(qIdx, "correct_option", oIdx)}
                                className="accent-emerald-600 size-4 shrink-0 cursor-pointer ml-1"
                                title="Mark as correct option"
                              />
                              <span
                                className={cn(
                                  "text-xs font-bold w-4 shrink-0 text-center",
                                  isCorrect ? "text-emerald-700" : "text-muted-foreground"
                                )}
                              >
                                {label}
                              </span>
                              <Input
                                value={q.options[oIdx]}
                                onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                placeholder={`Option ${label}`}
                                className="h-7 text-xs bg-transparent border-0 shadow-none focus-visible:ring-0 px-1"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-50/60 border border-indigo-100">
                <Info className="size-4 text-[#4F46E5] shrink-0 mt-0.5" />
                <p className="text-xs text-[#3730A3] leading-relaxed">
                  Questions added here will be automatically saved and activated for this drive. You can also edit or append more questions at any time from the Drive Candidates page.
                </p>
              </div>
            </div>
          </div>
        </FormSection>
      )}

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
