"use client";

import { useState } from "react";
import {
  Building2,
  Users,
  Bell,
  CreditCard,
  Plus,
  CheckCircle2,
  Mail,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { companyProfile } from "@/lib/mock-data";

type Tab = "profile" | "team" | "notifications" | "billing";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Company Profile", icon: Building2 },
  { id: "team", label: "Team Members", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
];

function SectionHead({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );
}

export default function CompanySettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [savedProfile, setSavedProfile] = useState(false);
  const [prefs, setPrefs] = useState({
    ai_alerts: true,
    new_apps: false,
    interviews: true,
    weekly: true,
  });

  const handleSaveProfile = () => {
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Company Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your organization profile, team members, and preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Nav */}
        <nav className="md:w-56 shrink-0">
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full whitespace-nowrap ${
                    isActive
                      ? "bg-[#EEF2FF] text-[#3730A3]"
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

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── Company Profile ── */}
          {activeTab === "profile" && (
            <Card className="card-shadow border-border/60">
              <CardContent className="p-6">
                <SectionHead title="Organization Details" description="Update your company's public information." />
                
                <div className="flex items-center gap-5 mb-6">
                  <div
                    className="size-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-sm"
                    style={{ backgroundColor: companyProfile.color }}
                  >
                    {companyProfile.initials}
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">Change Logo</Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs">Company Name</Label>
                    <Input defaultValue={companyProfile.name} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Industry</Label>
                    <Input defaultValue="Technology" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Website URL</Label>
                    <Input defaultValue="https://google.com" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Tagline</Label>
                    <Input defaultValue={companyProfile.tagline} className="h-9 text-sm" />
                  </div>
                </div>

                <Separator className="my-6" />
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} className="brand-gradient text-white text-xs gap-2">
                    {savedProfile ? <><CheckCircle2 className="size-3.5" /> Saved</> : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Team Members ── */}
          {activeTab === "team" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SectionHead title="Team Management" description="Manage who can access and post drives for your organization." />
                <Button className="brand-gradient text-white text-xs gap-2 mb-5 h-8">
                  <Plus className="size-3.5" /> Invite Member
                </Button>
              </div>

              <Card className="card-shadow border-border/60">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="text-xs font-bold bg-[#4F46E5] text-white">PS</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Priya Sharma <span className="text-muted-foreground font-normal">(You)</span></p>
                        <p className="text-xs tracking-tight text-muted-foreground">priya.sharma@google.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#3730A3] text-xs tracking-tight font-bold uppercase tracking-wider">Admin</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">RJ</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Rahul Jain</p>
                        <p className="text-xs tracking-tight text-muted-foreground">rahul.jain@google.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs tracking-tight font-bold uppercase tracking-wider">Recruiter</span>
                      <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="size-4" /></button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Notification Preferences ── */}
          {activeTab === "notifications" && (
            <Card className="card-shadow border-border/60">
              <CardContent className="p-6">
                <SectionHead title="Alert Preferences" description="Configure what events you want to be notified about." />
                
                <div className="divide-y divide-border/60">
                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="size-4 text-[#5B21B6]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">AI Analysis Alerts</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Get notified instantly when AI finishes scoring a batch of candidates.</p>
                      </div>
                    </div>
                    <Switch checked={prefs.ai_alerts} onCheckedChange={(v) => setPrefs(p => ({...p, ai_alerts: v}))} />
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Users className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">New Applications</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Get notified every time a candidate applies to your live drives.</p>
                      </div>
                    </div>
                    <Switch checked={prefs.new_apps} onCheckedChange={(v) => setPrefs(p => ({...p, new_apps: v}))} />
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center shrink-0 mt-0.5">
                        <Mail className="size-4 text-[#4F46E5]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Weekly Summary</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Receive a weekly digest of your recruitment funnel metrics.</p>
                      </div>
                    </div>
                    <Switch checked={prefs.weekly} onCheckedChange={(v) => setPrefs(p => ({...p, weekly: v}))} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Billing & Plan ── */}
          {activeTab === "billing" && (
            <Card className="card-shadow border-border/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#8B5CF6]/10 to-transparent blur-3xl rounded-bl-full pointer-events-none" />
              <CardContent className="p-6">
                <SectionHead title="Current Plan" description="You are currently on the Enterprise plan." />
                
                <div className="p-5 rounded-xl border border-[#4F46E5]/30 bg-[#EEF2FF]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#3730A3] flex items-center gap-2">
                      <Sparkles className="size-4 text-[#8B5CF6]" />
                      Enterprise AI Tier
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                      Unlimited active drives, 10,000 AI screenings/month, and premium video proctoring.
                    </p>
                  </div>
                  <Button className="brand-gradient text-white text-xs whitespace-nowrap">
                    Manage Billing
                  </Button>
                </div>

                <div className="mt-6 flex items-center justify-between text-sm">
                  <span className="font-medium">AI Screenings Used</span>
                  <span className="font-bold text-foreground">2,450 / 10,000</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full ai-gradient w-[24.5%]" />
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
