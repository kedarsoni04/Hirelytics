"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  Sparkles,
  Briefcase,
  CheckCircle2,
  Download,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

interface AnalyticsResponse {
  total_applicants: number;
  total_drives: number;
  shortlist_rate: number;
  applicants_per_drive: { name: string; applicants: number; title: string; count: number }[];
  funnel: {
    applied: number;
    screened: number;
    shortlisted: number;
    interviewed: number;
    offered: number;
    hired: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCompanyAnalytics()
      .then((res: AnalyticsResponse) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load analytics:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalApplicants = data?.total_applicants ?? 0;
  const totalDrives = data?.total_drives ?? 0;
  const shortlistRate = data?.shortlist_rate ?? 0;
  const funnel = data?.funnel ?? {
    applied: 0,
    screened: 0,
    shortlisted: 0,
    interviewed: 0,
    offered: 0,
    hired: 0,
  };

  const funnelData = [
    { stage: "Applied", count: funnel.applied },
    { stage: "Screened", count: funnel.screened },
    { stage: "Shortlisted", count: funnel.shortlisted },
    { stage: "Interviewed", count: funnel.interviewed },
    { stage: "Offered", count: funnel.offered },
    { stage: "Hired", count: funnel.hired },
  ];

  const applicantsPerDrive = (data?.applicants_per_drive ?? []).map((d) => ({
    name: d.title || d.name || "Drive",
    applicants: d.applicants ?? d.count ?? 0,
  }));

  const offerCount = funnel.offered + funnel.hired;
  const offerRate = totalApplicants > 0 ? Math.round((offerCount / totalApplicants) * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Insights across all your active and closed recruitment drives.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-9 gap-2 text-xs">
            <Calendar className="size-4" /> All-Time
          </Button>
          <Button className="brand-gradient text-white h-9 gap-2 font-semibold">
            <Download className="size-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-shadow border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
              <Users className="size-6 text-[#4F46E5]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Applicants</p>
              <p className="text-2xl font-bold text-foreground">{totalApplicants}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-[#EDE9FE] flex items-center justify-center shrink-0">
              <Sparkles className="size-6 text-[#5B21B6]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shortlist Rate</p>
              <p className="text-2xl font-bold text-foreground">{shortlistRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
              <Briefcase className="size-6 text-[#D97706]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Drives</p>
              <p className="text-2xl font-bold text-foreground">{totalDrives}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-[#D1FAE5] flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Offer / Hired Rate</p>
              <p className="text-2xl font-bold text-foreground">{offerRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Applicants Per Drive - Bar Chart */}
        <Card className="card-shadow border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Applicants Per Drive</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
            {applicantsPerDrive.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No drive application data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={applicantsPerDrive} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px", fontWeight: "bold" }}
                  />
                  <Bar dataKey="applicants" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Hiring Funnel - Area Chart */}
        <Card className="card-shadow border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Recruitment Funnel Drop-off</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
            {totalApplicants === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No applicants in the recruitment funnel yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
