"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

export default function InputShowcase() {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-6">Input Fields</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Left column */}
        <div className="space-y-5">

          {/* Default */}
          <div className="space-y-1.5">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              placeholder="e.g. Google, Microsoft, Razorpay"
            />
          </div>

          {/* With icon (search) */}
          <div className="space-y-1.5">
            <Label htmlFor="search-drives">Search Drives</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="search-drives"
                placeholder="Search by role, company or location…"
                className="pl-9"
              />
            </div>
          </div>

          {/* With icon (email) */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="ananya@iitb.ac.in"
                className="pl-9"
              />
            </div>
          </div>

          {/* Success state */}
          <div className="space-y-1.5">
            <Label htmlFor="verified-email" className="text-emerald-700 dark:text-emerald-400">
              Email Address — Verified
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="verified-email"
                type="email"
                value="ananya@iitb.ac.in"
                readOnly
                className="pl-9 border-emerald-400 focus-visible:ring-emerald-400/30 pr-9"
              />
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-emerald-500" />
            </div>
          </div>

          {/* Error state */}
          <div className="space-y-1.5">
            <Label htmlFor="phone-error" className="text-rose-500">
              Phone Number — Error
            </Label>
            <div className="relative">
              <Input
                id="phone-error"
                value="9876abc"
                aria-invalid="true"
                className="pr-9 border-rose-400 focus-visible:ring-rose-400/30"
              />
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-rose-500" />
            </div>
            <p className="text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="size-3" />
              Please enter a valid 10-digit phone number
            </p>
          </div>

          {/* Disabled */}
          <div className="space-y-1.5">
            <Label htmlFor="uid-disabled" className="text-muted-foreground">
              Student UID — Read Only
            </Label>
            <Input id="uid-disabled" value="HL-2025-00482" disabled />
          </div>

        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Select dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="role-select">Role Category</Label>
            <Select>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="swe">Software Engineering</SelectItem>
                <SelectItem value="data">Data & Analytics</SelectItem>
                <SelectItem value="pm">Product Management</SelectItem>
                <SelectItem value="design">UI/UX Design</SelectItem>
                <SelectItem value="devops">DevOps & Infrastructure</SelectItem>
                <SelectItem value="ml">Machine Learning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Select — error */}
          <div className="space-y-1.5">
            <Label htmlFor="dept-select" className="text-rose-500">
              Department — Required
            </Label>
            <Select>
              <SelectTrigger id="dept-select" aria-invalid="true" className="border-rose-400">
                <SelectValue placeholder="Select department…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cse">Computer Science</SelectItem>
                <SelectItem value="ece">Electronics & Communication</SelectItem>
                <SelectItem value="mech">Mechanical</SelectItem>
                <SelectItem value="civil">Civil</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-rose-500">This field is required</p>
          </div>

          {/* Textarea — default */}
          <div className="space-y-1.5">
            <Label htmlFor="job-desc">Job Description</Label>
            <Textarea
              id="job-desc"
              placeholder="Describe the role, responsibilities, and expectations…"
              rows={4}
            />
          </div>

          {/* Textarea — with char count */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="cover-letter">Cover Letter</Label>
              <span className="text-xs text-muted-foreground">142 / 500</span>
            </div>
            <Textarea
              id="cover-letter"
              defaultValue="I am a final year B.Tech student at IIT Bombay with a strong background in full-stack development and machine learning. I have completed internships at Razorpay and worked on open source projects with 500+ GitHub stars."
              rows={4}
            />
          </div>

        </div>
      </div>
    </section>
  );
}
