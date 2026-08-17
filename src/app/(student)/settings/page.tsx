"use client";

import { useState } from "react";
import {
  Bell,
  Mail,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  Smartphone,
  Globe,
  Lock,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { studentProfile } from "@/lib/mock-data";

// ── Tab definitions ───────────────────────────────────────────────────────────

type Tab = "account" | "notifications" | "security" | "danger";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "account", label: "Account Info", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Password & Security", icon: Shield },
  { id: "danger", label: "Danger Zone", icon: Trash2 },
];

// ── Notification preference rows ─────────────────────────────────────────────

type PrefRow = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
};

const notifPrefs: PrefRow[] = [
  { id: "email_applications", label: "Application Updates", description: "Email alerts when your application status changes.", icon: Mail },
  { id: "email_interviews", label: "Interview Reminders", description: "Email reminders 24h and 1h before a scheduled interview.", icon: Bell },
  { id: "email_offers", label: "Offer Notifications", description: "Email instantly when you receive a job offer.", icon: Mail },
  { id: "inapp_ai", label: "AI Insights (In-App)", description: "In-app notifications when AI analysis is ready.", icon: Smartphone },
  { id: "inapp_applications", label: "Application Alerts (In-App)", description: "In-app badge and alert for all application events.", icon: Smartphone },
  { id: "email_digest", label: "Weekly Digest", description: "Weekly summary of activity, new drives, and AI tips.", icon: Mail },
];

// ── Toggle switch row ──────────────────────────────────────────────────────────

function PrefToggleRow({ pref, checked, onChange }: { pref: PrefRow; checked: boolean; onChange: (v: boolean) => void }) {
  const Icon = pref.icon;
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{pref.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{pref.description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="shrink-0"
      />
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHead({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [showPassword, setShowPassword] = useState(false);
  const [savedAccount, setSavedAccount] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(notifPrefs.map((p) => [p.id, p.id !== "email_digest"]))
  );

  const handleSaveAccount = () => {
    setSavedAccount(true);
    setTimeout(() => setSavedAccount(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account preferences and security settings.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab sidebar */}
        <nav className="md:w-48 shrink-0">
          <div className="flex md:flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDanger = tab.id === "danger";
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                    isActive
                      ? isDanger
                        ? "bg-[#FFE4E6] text-[#9F1239]"
                        : "bg-[#EEF2FF] text-[#3730A3]"
                      : isDanger
                      ? "text-[#F43F5E] hover:bg-[#FFE4E6]/60"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">

          {/* ── Account Info ── */}
          {activeTab === "account" && (
            <Card className="card-shadow border-border/60">
              <CardContent className="p-6">
                <SectionHead title="Account Information" description="Update your personal details and contact information." />
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="s-name" className="text-xs">Full Name</Label>
                      <Input id="s-name" defaultValue={studentProfile.name} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="s-email" className="text-xs">Email Address</Label>
                      <Input id="s-email" type="email" defaultValue={studentProfile.email} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="s-college" className="text-xs">College / University</Label>
                      <Input id="s-college" defaultValue={studentProfile.college} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="s-branch" className="text-xs">Branch / Programme</Label>
                      <Input id="s-branch" defaultValue={studentProfile.branch} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="s-cgpa" className="text-xs">CGPA</Label>
                      <Input id="s-cgpa" defaultValue={String(studentProfile.cgpa)} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="s-year" className="text-xs">Graduation Year</Label>
                      <Input id="s-year" defaultValue={String(studentProfile.graduationYear)} className="h-9 text-sm" />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button onClick={handleSaveAccount} className="brand-gradient text-white text-xs gap-2 hover:opacity-90 transition-opacity">
                      {savedAccount ? (
                        <><CheckCircle2 className="size-3.5" /> Saved</>
                      ) : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Notification Preferences ── */}
          {activeTab === "notifications" && (
            <Card className="card-shadow border-border/60">
              <CardContent className="p-6">
                <SectionHead title="Notification Preferences" description="Choose how and when you want to be notified about your recruitment activity." />
                <div className="divide-y divide-border/60">
                  {notifPrefs.map((pref) => (
                    <PrefToggleRow
                      key={pref.id}
                      pref={pref}
                      checked={prefs[pref.id]}
                      onChange={(v) => setPrefs((p) => ({ ...p, [pref.id]: v }))}
                    />
                  ))}
                </div>
                <Separator className="mt-4 mb-4" />
                <div className="flex justify-end">
                  <Button className="brand-gradient text-white text-xs hover:opacity-90 transition-opacity">
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Security ── */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <Card className="card-shadow border-border/60">
                <CardContent className="p-6 space-y-4">
                  <SectionHead title="Change Password" description="Use a strong password with at least 8 characters, numbers and symbols." />
                  <div className="space-y-3 max-w-sm">
                    <div className="space-y-2">
                      <Label htmlFor="s-curr" className="text-xs">Current Password</Label>
                      <div className="relative">
                        <Input id="s-curr" type={showPassword ? "text" : "password"} placeholder="••••••••" className="h-9 text-sm pr-9" />
                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="s-new" className="text-xs">New Password</Label>
                      <Input id="s-new" type="password" placeholder="••••••••" className="h-9 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="s-confirm" className="text-xs">Confirm New Password</Label>
                      <Input id="s-confirm" type="password" placeholder="••••••••" className="h-9 text-sm" />
                    </div>
                  </div>
                  <Button className="brand-gradient text-white text-xs hover:opacity-90 transition-opacity gap-2">
                    <KeyRound className="size-3.5" /> Update Password
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-shadow border-border/60">
                <CardContent className="p-6">
                  <SectionHead title="Two-Factor Authentication" description="Add an extra layer of security to your account." />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Lock className="size-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Authenticator App</p>
                        <p className="text-xs text-muted-foreground">Not configured</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">Enable 2FA</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Danger Zone ── */}
          {activeTab === "danger" && (
            <Card className="card-shadow border-[#F43F5E]/30 border bg-[#FFF1F2]">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-[#F43F5E] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-base font-semibold text-[#9F1239]">Danger Zone</h2>
                    <p className="text-xs text-[#BE123C] mt-0.5">
                      These actions are irreversible. Please proceed with caution.
                    </p>
                  </div>
                </div>

                <Separator className="bg-[#F43F5E]/20" />

                <div className="space-y-4">
                  {/* Deactivate */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-[#F43F5E]/20">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Deactivate Account</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Temporarily hide your profile from recruiters. You can reactivate anytime.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs border-[#F59E0B] text-[#92400E] hover:bg-[#FEF3C7] shrink-0">
                      Deactivate
                    </Button>
                  </div>

                  {/* Delete */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-[#F43F5E]/40">
                    <div>
                      <p className="text-sm font-semibold text-[#9F1239]">Delete Account</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Permanently delete your account and all associated data. This cannot be undone.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="text-xs bg-[#F43F5E] hover:bg-[#E11D48] text-white shrink-0"
                    >
                      <Trash2 className="size-3.5 mr-1.5" /> Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
