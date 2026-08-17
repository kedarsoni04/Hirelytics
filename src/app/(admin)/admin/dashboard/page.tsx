"use client";

import type { Metadata } from "next";
import { Building2, Users, Briefcase, Award, CheckCircle2, XCircle, Clock, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { platformStats, platformActivity, adminCompanies } from "@/lib/mock-data";
import { useState } from "react";

const statIcons: Record<string, React.ElementType> = {
  building: Building2,
  users: Users,
  briefcase: Briefcase,
  award: Award,
};

export default function AdminDashboardPage() {
  const [pendingCompanies, setPendingCompanies] = useState(adminCompanies.filter(c => c.status === "Pending"));

  const handleApprove = (id: string) => {
    console.log(`Approved company: ${id}`);
    setPendingCompanies(prev => prev.filter(c => c.id !== id));
  };

  const handleReject = (id: string) => {
    console.log(`Rejected company: ${id}`);
    setPendingCompanies(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Overview of platform activity, registrations, and pending approvals.
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformStats.map((stat) => {
          const Icon = statIcons[stat.icon] || Briefcase;
          return (
            <Card key={stat.label} className="card-shadow border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="size-9 rounded-xl flex items-center justify-center bg-admin-slate">
                    <Icon className="size-4 text-white" />
                  </div>
                  {stat.trendUp !== null && (
                    <span className={`text-xs tracking-tight font-semibold px-1.5 py-0.5 rounded-full ${stat.trendUp ? "bg-[#D1FAE5] text-[#065F46]" : "bg-muted text-muted-foreground"}`}>
                      {stat.trendUp ? "↑" : ""} {stat.trend}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                {stat.trendUp === null && (
                  <p className="text-xs tracking-tight text-muted-foreground mt-1">{stat.trend}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Recent Activity */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-foreground">Recent Platform Activity</h2>
          <Card className="card-shadow border-border/60">
            <CardContent className="p-0">
              {platformActivity.map((item, i) => (
                <div key={item.id}>
                  {i > 0 && <Separator />}
                  <div className="flex items-start gap-3 px-5 py-4">
                    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      item.ai ? "ai-gradient" : item.type === "warning" ? "bg-amber-100" : item.type === "success" ? "bg-emerald-100" : "bg-muted"
                    }`}>
                      {item.ai ? (
                        <Sparkles className="size-4 text-white" />
                      ) : item.type === "warning" ? (
                        <CheckCircle2 className="size-4 text-amber-600" />
                      ) : item.type === "success" ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <Clock className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed ${item.ai ? "text-[#4C1D95] font-medium" : "text-foreground"}`}>
                        {item.text}
                      </p>
                      <p className="text-xs tracking-tight text-muted-foreground mt-1">{item.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Pending Approvals</h2>
            <span className="text-xs tracking-tight font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {pendingCompanies.length} Action Needed
            </span>
          </div>
          
          <div className="space-y-3">
            {pendingCompanies.map((company) => (
              <Card key={company.id} className="card-shadow border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center font-bold text-foreground shrink-0">
                      {company.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{company.name}</p>
                      <p className="text-xs tracking-tight text-muted-foreground truncate">{company.industry} · Joined {company.joined}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(company.id)} size="sm" className="flex-1 text-xs h-8 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold gap-1.5">
                      <CheckCircle2 className="size-3.5" /> Approve
                    </Button>
                    <Button onClick={() => handleReject(company.id)} size="sm" variant="outline" className="flex-1 text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1.5">
                      <XCircle className="size-3.5" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {pendingCompanies.length === 0 && (
              <Card className="border-dashed border-border">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-500 opacity-50" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs mt-1">No pending registrations.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
