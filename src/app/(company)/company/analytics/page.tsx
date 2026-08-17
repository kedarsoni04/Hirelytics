"use client";

import { useState } from "react";
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
  Clock,
  CheckCircle2,
  Download,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsData } from "@/lib/mock-data";

export default function AnalyticsPage() {
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
            <Calendar className="size-4" /> Last 30 Days
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
              <p className="text-2xl font-bold text-foreground">954</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-[#EDE9FE] flex items-center justify-center shrink-0">
              <Sparkles className="size-6 text-[#5B21B6]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Shortlist Rate</p>
              <p className="text-2xl font-bold text-foreground">10.4%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
              <Clock className="size-6 text-[#D97706]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Time-to-Hire</p>
              <p className="text-2xl font-bold text-foreground">14 Days</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-border/60">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-[#D1FAE5] flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Offer Acceptance</p>
              <p className="text-2xl font-bold text-foreground">85%</p>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.applicantsPerDrive} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px", fontWeight: "bold" }}
                />
                <Bar dataKey="applicants" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hiring Funnel - Area Chart */}
        <Card className="card-shadow border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Recruitment Funnel Drop-off</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
