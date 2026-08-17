"use client";

import { useState } from "react";
import { Download, Save, CheckCircle2, User, GraduationCap, Briefcase, Code, Award, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import ResumePreview from "@/components/resume/ResumePreview";
import { resumeData } from "@/lib/mock-data";

export default function ResumeBuilderPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
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
          <Button variant="outline" size="sm" onClick={handleSave} className="gap-2 text-xs">
            {isSaving ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <Save className="size-3.5" />}
            {isSaving ? "Saved" : "Save Draft"}
          </Button>
          <Button size="sm" className="brand-gradient text-white hover:opacity-90 transition-opacity gap-2 text-xs">
            <Download className="size-3.5" /> Download PDF
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
                As you type, Hirelytics AI will suggest high-impact action verbs and quantify your achievements to boost your ATS score.
              </p>
            </div>
          </div>

          <Accordion defaultValue={["personal"]} className="space-y-4">
            
            {/* Personal Info */}
            <AccordionItem value="personal" className="border-none bg-white rounded-xl card-shadow overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50 data-[state=open]:border-b border-border">
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
                    <Input id="name" defaultValue={resumeData.personal.name} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs">Professional Title</Label>
                    <Input id="title" defaultValue={resumeData.personal.title} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs">Email Address</Label>
                    <Input id="email" defaultValue={resumeData.personal.email} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                    <Input id="phone" defaultValue={resumeData.personal.phone} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-xs">Location</Label>
                    <Input id="location" defaultValue={resumeData.personal.location} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-xs">LinkedIn URL</Label>
                    <Input id="linkedin" defaultValue={resumeData.personal.linkedin} className="h-9 text-xs" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="summary" className="text-xs">Professional Summary</Label>
                    <Textarea id="summary" defaultValue={resumeData.personal.summary} className="min-h-[100px] text-xs resize-none" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Education */}
            <AccordionItem value="education" className="border-none bg-white rounded-xl card-shadow overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50 data-[state=open]:border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <GraduationCap className="size-4 text-emerald-600" />
                  </div>
                  <span className="font-semibold text-sm">Education</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-5">
                <p className="text-xs text-muted-foreground mb-4">Add your degrees and educational background.</p>
                <Button variant="outline" size="sm" className="w-full border-dashed text-xs">+ Add Education</Button>
              </AccordionContent>
            </AccordionItem>

            {/* Experience */}
            <AccordionItem value="experience" className="border-none bg-white rounded-xl card-shadow overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50 data-[state=open]:border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Briefcase className="size-4 text-amber-600" />
                  </div>
                  <span className="font-semibold text-sm">Experience</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-5">
                <p className="text-xs text-muted-foreground mb-4">List your internships and work experience.</p>
                <Button variant="outline" size="sm" className="w-full border-dashed text-xs">+ Add Experience</Button>
              </AccordionContent>
            </AccordionItem>

            {/* Projects */}
            <AccordionItem value="projects" className="border-none bg-white rounded-xl card-shadow overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50 data-[state=open]:border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-rose-50 flex items-center justify-center">
                    <Code className="size-4 text-rose-600" />
                  </div>
                  <span className="font-semibold text-sm">Projects</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-5">
                <p className="text-xs text-muted-foreground mb-4">Showcase your technical projects.</p>
                <Button variant="outline" size="sm" className="w-full border-dashed text-xs">+ Add Project</Button>
              </AccordionContent>
            </AccordionItem>

            {/* Skills & Achievements */}
            <AccordionItem value="skills" className="border-none bg-white rounded-xl card-shadow overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-accent/50 data-[state=open]:border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Award className="size-4 text-violet-600" />
                  </div>
                  <span className="font-semibold text-sm">Skills & Achievements</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-5">
                <p className="text-xs text-muted-foreground mb-4">List your technical skills and notable achievements.</p>
                <Button variant="outline" size="sm" className="w-full border-dashed text-xs">+ Edit Skills</Button>
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
            {/* A4 aspect ratio container for preview */}
            <div className="w-full max-w-[800px] h-fit shrink-0">
              <ResumePreview />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
