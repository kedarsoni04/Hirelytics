"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bell,
  Building2,
  FileText,
  Star,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  {
    group: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", active: true, badge: null },
      { icon: Briefcase, label: "Drives", active: false, badge: "34" },
      { icon: Users, label: "Applicants", active: false, badge: "2.8k" },
      { icon: Star, label: "Shortlisted", active: false, badge: "142" },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { icon: Sparkles, label: "AI Insights", active: false, badge: "3", ai: true },
      { icon: BarChart3, label: "Reports", active: false, badge: null },
    ],
  },
  {
    group: "Manage",
    items: [
      { icon: Building2, label: "Company", active: false, badge: null },
      { icon: FileText, label: "Templates", active: false, badge: null },
      { icon: Bell, label: "Notifications", active: false, badge: "7" },
      { icon: Settings, label: "Settings", active: false, badge: null },
    ],
  },
];

export default function SidebarPreview() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-6">Sidebar Navigation</h2>
      <div className="flex rounded-xl border border-border overflow-hidden card-shadow" style={{ height: 520 }}>

        {/* Sidebar */}
        <aside
          className="flex flex-col bg-sidebar transition-all duration-300 ease-in-out shrink-0"
          style={{ width: collapsed ? 60 : 220 }}
        >
          {/* Logo */}
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-sidebar-border shrink-0">
            <div className="size-7 rounded-lg brand-gradient flex items-center justify-center shrink-0">
              <Sparkles className="size-4 text-white" />
            </div>
            {!collapsed && (
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight">
                Hirelytics
              </span>
            )}
          </div>

          {/* Nav groups */}
          <nav className="flex-1 py-3 overflow-y-auto">
            {navItems.map((group) => (
              <div key={group.group} className="mb-4">
                {!collapsed && (
                  <p className="px-4 mb-1 text-xs tracking-tight font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                    {group.group}
                  </p>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      className={`w-full flex items-center gap-3 h-9 rounded-lg mx-2 transition-colors
                        ${collapsed ? "justify-center px-0 w-auto" : "px-3"}
                        ${
                          item.active
                            ? (item as { ai?: boolean }).ai
                              ? "ai-gradient text-white"
                              : "bg-sidebar-accent text-white"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        }`}
                      style={{ width: collapsed ? 44 : "calc(100% - 16px)" }}
                      title={item.label}
                    >
                      <Icon
                        className={`size-4 shrink-0 ${
                          item.active
                            ? "text-white"
                            : (item as { ai?: boolean }).ai
                            ? "text-violet-400"
                            : "text-sidebar-foreground/70"
                        }`}
                      />
                      {!collapsed && (
                        <>
                          <span className="text-xs font-medium flex-1 text-left truncate">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span
                              className={`text-xs tracking-tight font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                                (item as { ai?: boolean }).ai
                                  ? "bg-violet-500 text-white"
                                  : "bg-sidebar-foreground/10 text-sidebar-foreground/60"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom: help + user */}
          <div className="border-t border-sidebar-border p-3 space-y-1 shrink-0">
            <button
              className={`w-full flex items-center gap-3 h-9 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors ${
                collapsed ? "justify-center px-0" : "px-3"
              }`}
            >
              <HelpCircle className="size-4 shrink-0" />
              {!collapsed && <span className="text-xs font-medium">Help & Support</span>}
            </button>
            <div
              className={`flex items-center gap-2 h-10 px-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className="text-xs tracking-tight font-bold brand-gradient text-white">
                  RA
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">Ravi Anand</p>
                  <p className="text-xs tracking-tight text-sidebar-foreground/40 truncate">Google Inc.</p>
                </div>
              )}
              {!collapsed && <LogOut className="size-3.5 text-sidebar-foreground/40 hover:text-rose-400 shrink-0" />}
            </div>
          </div>
        </aside>

        {/* Collapse toggle */}
        <div className="relative">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-6 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-ring transition-all card-shadow z-10"
          >
            {collapsed ? (
              <ChevronRight className="size-3.5" />
            ) : (
              <ChevronLeft className="size-3.5" />
            )}
          </button>
        </div>

        {/* Main content preview */}
        <main className="flex-1 bg-background p-6 overflow-hidden">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Main Content Area</p>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-card border border-border/60 card-shadow flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Widget {i}</span>
              </div>
            ))}
          </div>
          <div className="h-32 rounded-xl bg-card border border-border/60 card-shadow mt-3 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Data Table / Chart Area</span>
          </div>
        </main>
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Click the <span className="font-medium">‹ ›</span> toggle button to collapse / expand the sidebar
      </p>
    </section>
  );
}
