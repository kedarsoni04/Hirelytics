"use client";

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, TrendingDown, Users, Briefcase, Star, ArrowRight } from "lucide-react";

export default function CardShowcase() {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-6">Card Components</h2>
      <div className="space-y-8">

        {/* Stat Cards */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Stat Cards</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Applicants", value: "2,847", icon: Users, trend: "+12%", up: true, color: "#4F46E5" },
              { label: "Active Drives", value: "34", icon: Briefcase, trend: "+3", up: true, color: "#10B981" },
              { label: "Avg AI Score", value: "76.4", icon: Sparkles, trend: "-1.2", up: false, color: "#8B5CF6" },
              { label: "Offers Sent", value: "189", icon: Star, trend: "+28", up: true, color: "#F59E0B" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="card-shadow hover:card-shadow-hover transition-all duration-200 border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="size-9 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: stat.color + "18" }}
                      >
                        <Icon className="size-4.5" style={{ color: stat.color }} />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          stat.up ? "text-emerald-600" : "text-rose-500"
                        }`}
                      >
                        {stat.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {stat.trend}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Standard content cards */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Content Cards</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Job drive card */}
            <Card className="card-shadow hover:card-shadow-hover transition-all duration-200 border-border/60">
              <CardHeader className="px-5 pt-5 pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Software Engineer — Intern</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Google · Bangalore, India</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#D1FAE5] text-[#065F46] shrink-0">
                    <span className="size-1.5 rounded-full bg-[#10B981]" />
                    Live
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-5 py-4">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {["React", "TypeScript", "Node.js"].map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>342 Applicants</span>
                  <span>Closes Jan 30, 2026</span>
                </div>
              </CardContent>
              <CardFooter className="px-5 pb-5 pt-0 flex items-center justify-between">
                <Button size="sm" variant="outline">View Applicants</Button>
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-[#EDE9FE] text-[#5B21B6] px-2 py-0.5 rounded-full">
                  <Sparkles className="size-3" />
                  AI Screened
                </span>
              </CardFooter>
            </Card>

            {/* Applicant profile card */}
            <Card className="card-shadow hover:card-shadow-hover transition-all duration-200 border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    AK
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">Ananya Krishnan</p>
                    <p className="text-xs text-muted-foreground">B.Tech CSE · IIT Bombay · 2025</p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold bg-[#EDE9FE] text-[#5B21B6] px-2.5 py-1 rounded-full shrink-0">
                    <Sparkles className="size-3" />
                    87
                  </span>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>CGPA</span><span className="font-medium text-foreground">9.2 / 10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Applied For</span><span className="font-medium text-foreground">SWE Intern</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stage</span>
                    <span className="font-medium text-[#065F46] bg-[#D1FAE5] px-2 py-0.5 rounded-full">
                      Technical Round
                    </span>
                  </div>
                </div>
                <Button size="sm" className="w-full mt-4" variant="outline">
                  View Profile <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* AI Insight Card */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">AI Insight Card</p>
          <Card className="border-l-4 border-l-violet-500 border-border/60 card-shadow ai-glow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-lg ai-gradient flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="size-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">AI Insight</p>
                    <span className="text-xs tracking-tight font-medium px-1.5 py-0.5 rounded bg-[#EDE9FE] text-[#5B21B6]">
                      GENERATED
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Based on the applicant&apos;s resume and test scores, Ananya shows strong proficiency in React and
                    system design. Her CGPA of 9.2 and internship at Razorpay place her in the <strong>top 5%</strong>{" "}
                    of all applicants for this role.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="ai-gradient text-white text-xs h-7 px-3 hover:opacity-90">
                      <Sparkles className="size-3 mr-1" /> Full Analysis
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7">
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </section>
  );
}
