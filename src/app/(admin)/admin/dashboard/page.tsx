"use client";

import { useEffect, useState } from "react";
import { Building2, Users, Briefcase, Award, CheckCircle2, XCircle, Clock, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

const statIcons: Record<string, React.ElementType> = {
  building: Building2,
  users: Users,
  briefcase: Briefcase,
  award: Award,
};

const statStyles: Record<string, { bg: string; text: string }> = {
  building: { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]" },
  users: { bg: "bg-[#D1FAE5]", text: "text-[#065F46]" },
  briefcase: { bg: "bg-[#EDE9FE]", text: "text-[#7C3AED]" },
  award: { bg: "bg-amber-50", text: "text-amber-600" },
};

interface AdminStatItem {
  label: string;
  value: number;
  icon: string;
  trend: string;
  trendUp: boolean | null;
}

interface PendingCompanyItem {
  id: string;
  name: string;
  industry: string;
  status: string;
  joined: string;
  logo: string;
}

interface ActivityItem {
  id: string;
  text: string;
  time: string;
  type: "success" | "default" | "warning";
  ai: boolean;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatItem[]>([]);
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompanyItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await api.getAdminDashboardStats();
      if (data) {
        setStats(data.stats || []);
        setPendingCompanies(data.pendingCompanies || []);
        setActivities(data.recentActivity || []);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.updateCompanyStatus(id, "verified");
      setPendingCompanies(prev => prev.filter(c => c.id !== id));
      loadData();
    } catch (e) {
      console.error("Failed to approve company:", e);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.updateCompanyStatus(id, "suspended");
      setPendingCompanies(prev => prev.filter(c => c.id !== id));
      loadData();
    } catch (e) {
      console.error("Failed to reject company:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

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
        {stats.map((stat) => {
          const Icon = statIcons[stat.icon] || Briefcase;
          const style = statStyles[stat.icon] || { bg: "bg-[#EEF2FF]", text: "text-[#4F46E5]" };
          return (
            <Card key={stat.label} className="card-shadow border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`size-9 rounded-xl flex items-center justify-center ${style.bg} ${style.text}`}>
                    <Icon className="size-4" />
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
              {activities.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No recent activity logged yet.
                </div>
              ) : (
                activities.map((item, i) => (
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
                ))
              )}
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
