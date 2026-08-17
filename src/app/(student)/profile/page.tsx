"use client";

import { useState } from "react";
import {
  Pencil,
  Check,
  X,
  MapPin,
  Globe,
  GitBranch,
  Link2,
  ExternalLink,
  FileText,
  GraduationCap,
  Code2,
  Sparkles,
  Upload,
  CheckCircle2,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { studentProfileExtended } from "@/lib/mock-data";

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const p = studentProfileExtended;
  const [editing, setEditing] = useState(false);
  const [saveDone, setSaveDone] = useState(false);

  const handleSave = () => {
    setSaveDone(true);
    setEditing(false);
    setTimeout(() => setSaveDone(false), 2500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* ── Profile header card ── */}
      <Card className="card-shadow border-border/60">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar */}
            <Avatar className="size-20 shrink-0">
              <AvatarFallback className="text-2xl font-bold brand-gradient text-white">
                {p.initials}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Full Name</Label>
                    <Input defaultValue={p.name} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Location</Label>
                    <Input defaultValue={p.location} className="h-8 text-sm" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Bio</Label>
                    <Textarea defaultValue={p.bio} className="min-h-[72px] text-xs resize-none" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="text-xl font-bold text-foreground">{p.name}</h1>
                      <p className="text-sm text-muted-foreground mt-0.5">{p.branch}</p>
                      <p className="text-xs text-muted-foreground">{p.college}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {saveDone && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 className="size-3.5" /> Saved
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(true)}
                        className="gap-1.5 text-xs"
                      >
                        <Pencil className="size-3.5" /> Edit Profile
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" /> {p.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="size-3.5" /> {p.email}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="size-3.5" /> {p.phone}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-xl">
                    {p.bio}
                  </p>

                  {/* Key stats strip */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF2FF] text-[#3730A3] text-xs font-semibold">
                      CGPA: {p.cgpa} / 10
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                      Class of {p.graduationYear}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                      UID: {p.uid}
                    </span>
                  </div>
                </>
              )}

              {/* Edit mode actions */}
              {editing && (
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={handleSave} className="brand-gradient text-white text-xs gap-1.5 hover:opacity-90 transition-opacity">
                    <Check className="size-3.5" /> Save Changes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="text-xs gap-1.5">
                    <X className="size-3.5" /> Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column grid for sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Education ── */}
        <Section icon={GraduationCap} title="Education" iconBg="#D1FAE5" iconColor="#059669">
          <div className="space-y-4">
            {p.education.map((edu, i) => (
              <div key={i}>
                {i > 0 && <Separator className="my-4" />}
                {editing ? (
                  <div className="space-y-2">
                    <Input defaultValue={edu.institution} className="h-8 text-xs" />
                    <Input defaultValue={edu.degree} className="h-8 text-xs" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input defaultValue={edu.period} className="h-8 text-xs" />
                      <Input defaultValue={edu.score} className="h-8 text-xs" />
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{edu.institution}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{edu.degree}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{edu.period}</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 shrink-0 bg-[#D1FAE5] px-2 py-1 rounded-lg">
                      {edu.score}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ── Links ── */}
        <Section icon={Globe} title="Links & Profiles" iconBg="#EDE9FE" iconColor="#5B21B6">
          <div className="space-y-3">
            {editing ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5"><Link2 className="size-3.5 text-[#0A66C2]" /> LinkedIn</Label>
                  <Input defaultValue={p.links.linkedin} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5"><GitBranch className="size-3.5" /> GitHub</Label>
                  <Input defaultValue={p.links.github} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5"><Globe className="size-3.5" /> Portfolio</Label>
                  <Input defaultValue={p.links.portfolio} className="h-8 text-xs" />
                </div>
              </>
            ) : (
              <>
                {[
                  { icon: Link2, label: "LinkedIn", value: p.links.linkedin, color: "#0A66C2" },
                  { icon: GitBranch, label: "GitHub", value: p.links.github, color: "#1F2937" },
                  { icon: Globe, label: "Portfolio", value: p.links.portfolio, color: "#4F46E5" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="size-4 shrink-0" style={{ color }} />
                      <div className="min-w-0">
                        <p className="text-xs tracking-tight font-medium text-muted-foreground">{label}</p>
                        <p className="text-xs font-medium text-foreground truncate">{value}</p>
                      </div>
                    </div>
                    <ExternalLink className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </>
            )}
          </div>
        </Section>

        {/* ── Skills ── */}
        <Section icon={Code2} title="Skills" iconBg="#FEF3C7" iconColor="#D97706">
          <div className="flex flex-wrap gap-2">
            {p.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent border border-border text-xs font-medium text-foreground hover:border-[#4F46E5]/40 hover:bg-[#EEF2FF] hover:text-[#3730A3] transition-colors cursor-default"
              >
                {skill}
                {editing && (
                  <X className="size-2.5 text-muted-foreground hover:text-[#F43F5E] cursor-pointer ml-0.5" />
                )}
              </span>
            ))}
            {editing && (
              <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors">
                + Add Skill
              </button>
            )}
          </div>
        </Section>

        {/* ── Resume ── */}
        <Section icon={FileText} title="Resume" iconBg="#EEF2FF" iconColor="#4F46E5">
          <div className="space-y-4">
            {/* Current resume */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#EEF2FF] border border-indigo-100">
              <div className="size-9 rounded-lg bg-[#4F46E5] flex items-center justify-center shrink-0">
                <FileText className="size-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{p.resume.fileName}</p>
                <p className="text-xs tracking-tight text-muted-foreground mt-0.5">Uploaded {p.resume.uploadedAt}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-xs tracking-tight font-medium text-emerald-700 bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="size-3" /> Verified
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs tracking-tight font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                    <Sparkles className="size-3" /> AI Score: {p.resume.aiScore}/100
                  </span>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full border-dashed text-xs gap-2">
              <Upload className="size-3.5" /> Upload New Resume
            </Button>
          </div>
        </Section>

      </div>
    </div>
  );
}
