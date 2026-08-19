"use client";

import { useEffect, useState } from "react";
import { Download, Save, CheckCircle2, User, GraduationCap, Briefcase, Code, Award, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import ResumePreview, { ResumeDataProps } from "@/components/resume/ResumePreview";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function ResumeBuilderPage() {
  const { user, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(user?.full_name || "");
  const [title, setTitle] = useState("Software Engineer");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [location, setLocation] = useState("India");
  const [linkedin, setLinkedin] = useState(user?.linkedin_url || "");
  const [github, setGithub] = useState(user?.github_url || "");
  const [summary, setSummary] = useState(
    "Detail-oriented software engineer with a strong foundation in algorithmic problem-solving and modern web development."
  );

  const [institution, setInstitution] = useState(user?.college || "");
  const [degree, setDegree] = useState(user?.branch ? `B.Tech in ${user.branch}` : "");
  const [period, setPeriod] = useState("2022 – 2026");
  const [score, setScore] = useState(user?.cgpa ? `CGPA: ${user.cgpa} / 10` : "");

  const [skillsStr, setSkillsStr] = useState(user?.skills ? user.skills.join(", ") : "");
  const [isInitialized, setIsInitialized] = useState(false);

  if (user && !isInitialized) {
    if (user.full_name) setName(user.full_name);
    if (user.email) setEmail(user.email);
    if (user.college) setInstitution(user.college);
    if (user.branch) setDegree(`B.Tech in ${user.branch}`);
    if (user.cgpa) setScore(`CGPA: ${user.cgpa} / 10`);
    if (user.linkedin_url) setLinkedin(user.linkedin_url);
    if (user.github_url) setGithub(user.github_url);
    if (user.skills && user.skills.length > 0) {
      setSkillsStr(user.skills.join(", "));
    }
    setIsInitialized(true);
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const skillsArray = skillsStr
        ? skillsStr.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;

      await api.updateProfile({
        full_name: name,
        college: institution,
        branch: degree.replace(/^B\.Tech in\s*/i, ""),
        linkedin_url: linkedin,
        github_url: github,
        skills: skillsArray,
      });

      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save resume profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const parsedSkills = skillsStr
    ? skillsStr.split(",").map((s) => s.trim()).filter(Boolean)
    : ["Python", "TypeScript", "React", "Next.js", "FastAPI", "PostgreSQL", "Docker", "Git"];

  const resumeState: ResumeDataProps = {
    personal: {
      name: name || "Your Name",
      title: title || "Software Engineer",
      email: email || "your.email@university.edu",
      phone,
      location,
      linkedin: linkedin || "linkedin.com/in/profile",
      github: github || "github.com/profile",
      summary,
    },
    education: [
      {
        institution: institution || "University / College",
        degree: degree || "B.Tech Computer Science",
        period,
        score: score || "CGPA: 8.5 / 10",
      },
    ],
    experience: [
      {
        role: "Software Engineering Intern",
        company: "Tech Enterprise",
        location: "Bangalore, India",
        period: "May 2025 – Jul 2025",
        bullets: [
          "Developed high-throughput API endpoints with async data pipelines.",
          "Implemented clean and responsive UI components with comprehensive testing.",
        ],
      },
    ],
    projects: [
      {
        name: "Hirelytics Recruitment Platform",
        tech: "Next.js, FastAPI, PostgreSQL",
        period: "2026",
        bullets: [
          "Implemented AI-assisted candidate screening and video interview evaluation pipelines.",
          "Constructed responsive dashboards for students and recruiter teams.",
        ],
      },
    ],
    skills: {
      languages: parsedSkills.slice(0, 4),
      frameworks: parsedSkills.slice(4, 7),
      tools: parsedSkills.slice(7),
    },
    achievements: [
      "Consistent academic performer with verified course certifications.",
      "Solved 300+ problem solving challenges across competitive programming platforms.",
    ],
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-56px)] flex flex-col min-h-0">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resume Builder</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Build your ATS-friendly resume. Changes sync automatically to your profile.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="gap-2 text-xs">
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="size-3.5 text-emerald-500" />
            ) : (
              <Save className="size-3.5" />
            )}
            {saved ? "Saved" : "Save to Profile"}
          </Button>
          <Button onClick={handleDownloadPDF} size="sm" className="brand-gradient text-white hover:opacity-90 transition-opacity gap-2 text-xs">
            <Download className="size-3.5" /> Download / Print PDF
          </Button>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        
        {/* Left: Editor (scrollable) */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-12 scrollbar-thin">
          
          <div className="bg-[#EEF2FF] p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
            <Sparkles className="size-5 text-[#4F46E5] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#3730A3]">AI Resume Optimization is Active</p>
              <p className="text-xs text-[#4F46E5] mt-1 leading-relaxed">
                As you type, Hirelytics updates your live ATS preview to ensure maximum keyword matching with recruiter drives.
              </p>
            </div>
          </div>

          <Accordion defaultValue={["personal", "education", "skills"]} className="space-y-4">
            
            {/* Personal Info */}
            <AccordionItem value="personal" className="border-none bg-white rounded-xl card-shadow overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50 data-open:border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <User className="size-4 text-[#4F46E5]" />
                  </div>
                  <span className="font-semibold text-sm">Personal Information</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs">Professional Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs">Email Address</Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-xs">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-xs">LinkedIn URL</Label>
                    <Input
                      id="linkedin"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="summary" className="text-xs">Professional Summary</Label>
                    <Textarea
                      id="summary"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="min-h-[100px] text-xs resize-none"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Education */}
            <AccordionItem value="education" className="border-none bg-white rounded-xl card-shadow overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50 data-open:border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <GraduationCap className="size-4 text-emerald-600" />
                  </div>
                  <span className="font-semibold text-sm">Education</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Institution</Label>
                    <Input
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Degree / Branch</Label>
                    <Input
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Timeline</Label>
                    <Input
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Score / CGPA</Label>
                    <Input
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Skills & Achievements */}
            <AccordionItem value="skills" className="border-none bg-white rounded-xl card-shadow overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50 data-open:border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Award className="size-4 text-violet-600" />
                  </div>
                  <span className="font-semibold text-sm">Skills & Keywords</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-5 space-y-3">
                <Label className="text-xs">Skills (Comma-separated)</Label>
                <Input
                  value={skillsStr}
                  onChange={(e) => setSkillsStr(e.target.value)}
                  placeholder="e.g. Python, TypeScript, React, Docker, FastAPI"
                  className="h-9 text-xs"
                />
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>

        {/* Right: Static Preview (sticky/scrollable container) */}
        <div className="hidden lg:flex flex-col bg-slate-50 rounded-2xl border border-border overflow-hidden h-full">
          <div className="h-10 bg-slate-200/50 border-b border-border flex items-center justify-center shrink-0">
            <span className="text-xs tracking-tight font-semibold text-slate-500 uppercase tracking-widest">Live Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-100/50">
            <div className="w-full max-w-[800px] h-fit shrink-0">
              <ResumePreview data={resumeState} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
