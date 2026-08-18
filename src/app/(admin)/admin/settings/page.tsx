"use client";

import { useState } from "react";
import { Settings2, Shield, Activity, Save, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/DataTable";
import { platformLogs } from "@/lib/mock-data";

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationsOpen, setRegistrationsOpen] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveConfig = () => {
    showToast("Platform configuration updated successfully.");
  };

  const handleInviteAdmin = () => {
    showToast("Admin invitation link generated & copied to clipboard.");
  };

  const logColumns: Column<typeof platformLogs[0]>[] = [
    { header: "Timestamp", accessorKey: "timestamp" },
    { header: "Action", accessorKey: "action" },
    { header: "User", accessorKey: "user" },
    { 
      header: "Status", 
      cell: (log) => {
        let bg = "bg-muted";
        let text = "text-muted-foreground";
        if (log.status === "Success") {
          bg = "bg-emerald-100"; text = "text-emerald-700";
        } else if (log.status === "Warning") {
          bg = "bg-amber-100"; text = "text-amber-700";
        } else if (log.status === "Failed") {
          bg = "bg-rose-100"; text = "text-rose-700";
        }
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${bg} ${text}`}>
            {log.status}
          </span>
        );
      } 
    },
  ];

  const adminTeam = [
    { name: "System Administrator", email: "admin@hirelytics.com", role: "Super Admin", access: "Full Access" },
    { name: "Rahul Verma", email: "rahul@hirelytics.com", role: "Moderator", access: "View & Flag Only" },
    { name: "Sneha Patil", email: "sneha@hirelytics.com", role: "Support Admin", access: "Manage Users" },
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings & Logs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure platform behaviors and review system audit trails.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ── Platform Settings ── */}
        <Card className="card-shadow border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="size-4 text-[#4F46E5]" /> Platform Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Toggle 1 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Disables login for non-admin users.</p>
              </div>
              <button 
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${maintenanceMode ? "bg-[#10B981]" : "bg-muted-foreground/30"}`}
              >
                <div className={`size-4 rounded-full bg-white transition-transform ${maintenanceMode ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Allow New Registrations</p>
                <p className="text-xs text-muted-foreground mt-0.5">Open platform to new student/company signups.</p>
              </div>
              <button 
                onClick={() => setRegistrationsOpen(!registrationsOpen)}
                className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${registrationsOpen ? "bg-[#10B981]" : "bg-muted-foreground/30"}`}
              >
                <div className={`size-4 rounded-full bg-white transition-transform ${registrationsOpen ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">AI Subsystem Active</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enable AI resume screening and video analysis.</p>
              </div>
              <button 
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${aiEnabled ? "bg-[#8B5CF6]" : "bg-muted-foreground/30"}`}
              >
                <div className={`size-4 rounded-full bg-white transition-transform ${aiEnabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>

            <Button onClick={handleSaveConfig} className="w-full brand-gradient text-white font-semibold gap-2">
              <Save className="size-4" /> Save Configuration
            </Button>
          </CardContent>
        </Card>

        {/* ── Admin Team ── */}
        <Card className="card-shadow border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="size-4 text-[#4F46E5]" /> Admin Team
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminTeam.map((admin, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div>
                  <p className="text-sm font-bold text-foreground">{admin.name}</p>
                  <p className="text-xs tracking-tight text-muted-foreground">{admin.email}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                    admin.role === "Super Admin" ? "bg-[#EEF2FF] text-[#4F46E5]" : "bg-muted text-muted-foreground"
                  }`}>
                    {admin.role}
                  </span>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-1">{admin.access}</p>
                </div>
              </div>
            ))}
            <Button onClick={handleInviteAdmin} variant="outline" className="w-full text-xs border-dashed">
              + Invite Admin User
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* ── System Logs ── */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Activity className="size-5 text-[#4F46E5]" /> System Logs
        </h2>
        <DataTable
          data={platformLogs}
          columns={logColumns}
          keyExtractor={(log) => log.id}
        />
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

    </div>
  );
}

