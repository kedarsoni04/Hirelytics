"use client";

import { useState } from "react";
import {
  Pencil,
  Check,
  X,
  Globe,
  GitBranch,
  Link2,
  ExternalLink,
  FileText,
  GraduationCap,
  Code2,
  Upload,
  CheckCircle2,
  Mail,
  Building2,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import ChipInput from "@/components/ui/ChipInput";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
  iconColor = "#4F46E5",
  iconBg = "#EEF2FF",
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <Card className="card-shadow border-border/60">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="size-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconBg }}
          >
            <Icon className="size-4" style={{ color: iconColor }} />
          </div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// ─── Empty state helper ───────────────────────────────────────────────────────

function EmptyField({ label }: { label: string }) {
  return <span className="text-xs text-muted-foreground/60 italic">{label}</span>;
}

// ── Page ─────────────────────────────────────────────────────────────────────

const SKILL_SUGGESTIONS = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java",
  "C++", "SQL", "Machine Learning", "Data Analysis", "Docker", "Git",
];

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveDone, setSaveDone] = useState(false);

  // Skills chip state (separate from string-valued form fields)
  const [editSkills, setEditSkills] = useState<string[]>([]);

  // Form state — initialised from user when edit mode opens
  const [form, setForm] = useState({
    full_name: "",
    college: "",
    branch: "",
    cgpa: "",
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
  });

  if (loading || !user) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const name = user.full_name || "";
  const initials = name ? name.substring(0, 2).toUpperCase() : "??";
  const college = user.college || "";
  const branch = user.branch || "";
  const cgpa = user.cgpa;
  const skills: string[] = user.skills ?? [];
  const linkedinUrl = user.linkedin_url || "";
  const githubUrl = user.github_url || "";
  const portfolioUrl = user.portfolio_url || "";

  // Open edit mode: pre-fill form from current user values
  const handleStartEdit = () => {
    setForm({
      full_name: user.full_name ?? "",
      college: user.college ?? "",
      branch: user.branch ?? "",
      cgpa: user.cgpa != null ? String(user.cgpa) : "",
      linkedin_url: user.linkedin_url ?? "",
      github_url: user.github_url ?? "",
      portfolio_url: user.portfolio_url ?? "",
    });
    setEditSkills(user.skills ?? []);
    setSaveError("");
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setSaveError("");
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      // Build payload with only changed / non-empty values
      const payload: Record<string, any> = {
        full_name: form.full_name.trim() || user.full_name,
        college: form.college.trim() || null,
        branch: form.branch.trim() || null,
        cgpa: form.cgpa ? parseFloat(form.cgpa) : null,
        skills: editSkills,
        linkedin_url: form.linkedin_url.trim() || null,
        github_url: form.github_url.trim() || null,
        portfolio_url: form.portfolio_url.trim() || null,
      };

      const updated = await api.updateProfile(payload);

      // updateUser merges changes into AuthContext immediately —
      // so Dashboard / Sidebar / Navbar all reflect the new name at once.
      updateUser({
        full_name: updated.full_name,
        college: updated.college,
        branch: updated.branch,
        cgpa: updated.cgpa,
        skills: updated.skills,
        linkedin_url: updated.linkedin_url,
        github_url: updated.github_url,
        portfolio_url: updated.portfolio_url,
      });

      setEditing(false);
      setSaveDone(true);
      setTimeout(() => setSaveDone(false), 2500);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* ── Profile header card ── */}
      <Card className="card-shadow border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <Avatar className="size-20 shrink-0">
              <AvatarFallback className="text-2xl font-bold brand-gradient text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                /* ── Edit mode ── */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name *</Label>
                      <Input {...field("full_name")} placeholder="e.g. Rahul Sharma" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">College / University</Label>
                      <Input {...field("college")} placeholder="e.g. VIT Vellore" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Branch / Department</Label>
                      <Input {...field("branch")} placeholder="e.g. ECE, CSE" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">CGPA (0–10)</Label>
                      <Input {...field("cgpa")} type="number" step="0.1" min="0" max="10" placeholder="e.g. 8.5" className="h-8 text-sm" />
                    </div>
                  </div>

                  {/* Skills in edit mode */}
                  <div className="space-y-2 pt-1">
                    <ChipInput
                      label="Skills"
                      chips={editSkills}
                      onChange={setEditSkills}
                      suggestions={SKILL_SUGGESTIONS}
                      placeholder="Type a skill and press Enter…"
                    />
                  </div>

                  {/* Links in edit mode */}
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Links & Profiles</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5"><Link2 className="size-3.5 text-[#0A66C2]" /> LinkedIn</Label>
                        <Input {...field("linkedin_url")} placeholder="linkedin.com/in/you" className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5"><GitBranch className="size-3.5" /> GitHub</Label>
                        <Input {...field("github_url")} placeholder="github.com/you" className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5"><Globe className="size-3.5" /> Portfolio</Label>
                        <Input {...field("portfolio_url")} placeholder="yoursite.dev" className="h-8 text-xs" />
                      </div>
                    </div>
                  </div>

                  {saveError && (
                    <p className="text-xs text-rose-500">{saveError}</p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="brand-gradient text-white text-xs gap-1.5 hover:opacity-90 transition-opacity"
                    >
                      {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      {saving ? "Saving…" : "Save Changes"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving} className="text-xs gap-1.5">
                      <X className="size-3.5" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="text-xl font-bold text-foreground">
                        {name || <EmptyField label="Name not set" />}
                      </h1>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {branch || <EmptyField label="Branch not set" />}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {college || <EmptyField label="College not set" />}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {saveDone && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 className="size-3.5" /> Saved
                        </span>
                      )}
                      <Button variant="outline" size="sm" onClick={handleStartEdit} className="gap-1.5 text-xs">
                        <Pencil className="size-3.5" /> Edit Profile
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="size-3.5" /> {user.email}
                    </span>
                    {college && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="size-3.5" /> {college}
                      </span>
                    )}
                  </div>

                  {/* Key stats strip */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    {cgpa != null ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF2FF] text-[#3730A3] text-xs font-semibold">
                        CGPA: {cgpa} / 10
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs italic">
                        CGPA not added
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column grid — only visible in view mode */}
      {!editing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Education ── */}
          <Section icon={GraduationCap} title="Education" iconBg="#D1FAE5" iconColor="#059669">
            {college || branch ? (
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {college || <EmptyField label="College not set" />}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {branch || <EmptyField label="Branch not set" />}
                  </p>
                </div>
                {cgpa != null && (
                  <span className="text-xs font-semibold text-emerald-600 shrink-0 bg-[#D1FAE5] px-2 py-1 rounded-lg">
                    CGPA {cgpa}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center gap-2">
                <BookOpen className="size-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No education details added yet.</p>
                <Button variant="outline" size="sm" className="text-xs mt-1" onClick={handleStartEdit}>
                  + Add Education
                </Button>
              </div>
            )}
          </Section>

          {/* ── Links & Profiles ── */}
          <Section icon={Globe} title="Links & Profiles" iconBg="#EDE9FE" iconColor="#5B21B6">
            <div className="space-y-3">
              {[
                { icon: Link2, label: "LinkedIn", value: linkedinUrl, color: "#0A66C2" },
                { icon: GitBranch, label: "GitHub", value: githubUrl, color: "#1F2937" },
                { icon: Globe, label: "Portfolio", value: portfolioUrl, color: "#4F46E5" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="size-4 shrink-0" style={{ color }} />
                    <div className="min-w-0">
                      <p className="text-xs tracking-tight font-medium text-muted-foreground">{label}</p>
                      {value ? (
                        <p className="text-xs font-medium text-foreground truncate">{value}</p>
                      ) : (
                        <EmptyField label="Not added yet" />
                      )}
                    </div>
                  </div>
                  {value && (
                    <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* ── Skills ── */}
          <Section icon={Code2} title="Skills" iconBg="#FEF3C7" iconColor="#D97706">
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent border border-border text-xs font-medium text-foreground hover:border-[#4F46E5]/40 hover:bg-[#EEF2FF] hover:text-[#3730A3] transition-colors cursor-default"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center gap-2">
                <Code2 className="size-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No skills added yet.</p>
                <Button variant="outline" size="sm" className="text-xs mt-1" onClick={handleStartEdit}>
                  + Add Skills
                </Button>
              </div>
            )}
          </Section>

          {/* ── Resume ── */}
          <Section icon={FileText} title="Resume" iconBg="#EEF2FF" iconColor="#4F46E5">
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6 text-center gap-2">
                <FileText className="size-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No resume uploaded yet.</p>
                <p className="text-xs text-muted-foreground/60">Upload your resume to boost your AI match score.</p>
              </div>
              <Button variant="outline" className="w-full border-dashed text-xs gap-2">
                <Upload className="size-3.5" /> Upload Resume
              </Button>
            </div>
          </Section>

        </div>
      )}
    </div>
  );
}
