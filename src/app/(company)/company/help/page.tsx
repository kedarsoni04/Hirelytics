"use client";

import type { Metadata } from "next";
import Link from "next/link";
import {
  HelpCircle,
  Mail,
  Phone,
  MessageSquare,
  FileQuestion,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  ChevronRight,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function CompanyHelpPage() {
  const [submitted, setSubmitted] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const faqs = [
    {
      q: "How does AI Resume Screening calculate candidate fit?",
      a: "Our AI engine analyzes candidate resumes against your specific job criteria, scoring required technical competencies, projects, and CGPA thresholds with high precision.",
    },
    {
      q: "Can I export candidate rankings and shortlists?",
      a: "Yes, you can export full CSV and JSON reports directly from any drive's Candidate Evaluation table or the Pipeline view.",
    },
    {
      q: "How do I schedule multi-stage technical rounds?",
      a: "Navigate to the Interviews module from the sidebar to set up automated time-slot selection and send calendar invites directly to candidates.",
    },
    {
      q: "What should I do if an assessment flag is triggered?",
      a: "You can review detailed video proctoring and tab-switch logs directly inside the Candidate Scorecard under the 'Integrity Report' tab.",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Help & Recruiter Support</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Find answers to frequently asked questions or connect with our university relations team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQs */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileQuestion className="size-4 text-[#4F46E5]" /> Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="card-shadow border-border/60">
                <CardContent className="p-4 space-y-1.5">
                  <p className="text-sm font-bold text-foreground">{faq.q}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Mail className="size-4 text-[#4F46E5]" /> Contact Support
          </h2>
          <Card className="card-shadow border-border/60">
            <CardContent className="p-5">
              {submitted ? (
                <div className="text-center py-6 space-y-2">
                  <CheckCircle2 className="size-10 text-emerald-600 mx-auto" />
                  <p className="text-sm font-bold text-foreground">Ticket Received!</p>
                  <p className="text-xs text-muted-foreground">
                    Our campus relations manager will respond within 2 business hours.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => {
                      setSubmitted(false);
                      setSubject("");
                      setMessage("");
                    }}
                  >
                    Submit another inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Subject</label>
                    <Input
                      placeholder="e.g. Schedule modification"
                      className="h-8 text-xs"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1 block">Message</label>
                    <Textarea
                      placeholder="Describe your issue or request..."
                      className="text-xs min-h-[90px]"
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full brand-gradient text-white text-xs font-semibold gap-1.5 h-8">
                    <Send className="size-3.5" /> Send Message
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Quick Help Box */}
          <div className="p-4 rounded-xl bg-[#EEF2FF] border border-indigo-100 space-y-1.5">
            <p className="text-xs font-bold text-[#3730A3]">Campus Desk Hotline</p>
            <p className="text-xs text-[#4F46E5] font-medium">+91 (080) 4567-8900</p>
            <p className="text-[11px] text-muted-foreground">Mon - Fri: 9:00 AM - 7:00 PM IST</p>
          </div>
        </div>
      </div>
    </div>
  );
}
