"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, Sparkles, FileText, Video, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { platformAnalyticsData } from "@/lib/mock-data";

const iconMap: Record<string, React.ElementType> = {
  "trending-up": TrendingUp,
  sparkles: Sparkles,
  "file-text": FileText,
  video: Video,
};

export default function PlatformAnalyticsPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Key metrics and growth trends across all companies and students.
          </p>
        </div>
        <Button variant="outline" className="h-9 gap-2 text-xs font-semibold">
          <Download className="size-3.5" /> Export Report
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformAnalyticsData.stats.map((stat, i) => {
          const Icon = iconMap[stat.icon] || TrendingUp;
          return (
            <Card key={i} className="card-shadow border-border/60">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
                  stat.icon === "sparkles" ? "ai-gradient" : "bg-[#EEF2FF]"
                }`}>
                  <Icon className={`size-6 ${stat.icon === "sparkles" ? "text-white" : "text-[#4F46E5]"}`} />
                </div>
                <div>
                  <p className="text-xs tracking-tight font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${stat.icon === "sparkles" ? "text-[#5B21B6]" : "text-foreground"}`}>
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Growth Line Chart */}
        <Card className="card-shadow border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Platform Growth (2026)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={platformAnalyticsData.growth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#64748B" }} 
                    dy={10} 
                  />
                  <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#64748B" }} 
                    dx={-10}
                    tickFormatter={(v) => `${v / 1000}k`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#64748B" }} 
                    dx={10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    cursor={{ stroke: "#E2E8F0" }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    name="Students"
                    dataKey="students" 
                    stroke="#4F46E5" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2 }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    name="Companies"
                    dataKey="companies" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 2 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-[#4F46E5]" />
                <span className="text-xs text-muted-foreground font-medium">Students Registered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-[#10B981]" />
                <span className="text-xs text-muted-foreground font-medium">Companies Onboarded</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Companies Bar Chart */}
        <Card className="card-shadow border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Hiring Companies (Offers Made)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformAnalyticsData.topCompanies} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis 
                    type="number"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#64748B" }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#0F172A", fontWeight: 600 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    cursor={{ fill: "#F8FAFC" }}
                  />
                  <Bar 
                    dataKey="offers" 
                    name="Offers Extended"
                    fill="#4F46E5" 
                    radius={[0, 4, 4, 0]} 
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
