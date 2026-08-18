"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  LayoutDashboard,
  Briefcase,
  FileText,
  Bell,
  Settings,
  HelpCircle,
  BookOpen,
  User,
  TrendingUp,
  Users,
  BarChart2,
  Calendar,
  ShieldCheck,
  Building2,
  GraduationCap,
  Activity,
  Settings2,
  Kanban,
  Plus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { studentProfile, companyProfile, adminProfile } from "@/lib/mock-data";

type NavItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  ai?: boolean;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

const studentNavItems: NavGroup[] = [
  {
    group: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: Briefcase, label: "Browse Drives", href: "/drives", badge: "34" },
      { icon: FileText, label: "My Applications", href: "/applications", badge: "12" },
      { icon: TrendingUp, label: "My Progress", href: "/progress" },
    ],
  },
  {
    group: "AI Tools",
    items: [
      { icon: Sparkles, label: "AI Interview Prep", href: "/interview/int-001", badge: "New", ai: true },
      { icon: BookOpen, label: "Resources", href: "/resources" },
    ],
  },
  {
    group: "Account",
    items: [
      { icon: User, label: "My Profile", href: "/profile" },
      { icon: FileText, label: "Resume Builder", href: "/resume" },
      { icon: Bell, label: "Notifications", href: "/notifications", badge: "3" },
      { icon: Settings, label: "Settings", href: "/settings" },
    ],
  },
];

const companyNavItems: NavGroup[] = [
  {
    group: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/company/dashboard" },
      { icon: Briefcase, label: "My Drives", href: "/company/drives", badge: "4" },
      { icon: Kanban, label: "Offer Pipeline", href: "/company/pipeline" },
      { icon: Users, label: "Candidates", href: "/company/drives/drv-001/candidates" },
      { icon: Calendar, label: "Interviews", href: "/company/interviews" },
      { icon: BarChart2, label: "Analytics", href: "/company/analytics" },
    ],
  },
  {
    group: "Account",
    items: [
      { icon: Bell, label: "Notifications", href: "/company/notifications", badge: "3" },
      { icon: Settings, label: "Settings", href: "/company/settings" },
      { icon: HelpCircle, label: "Help & Support", href: "/company/help" },
    ],
  },
];


const adminNavItems: NavGroup[] = [
  {
    group: "Platform",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
      { icon: Building2, label: "Manage Companies", href: "/admin/companies" },
      { icon: GraduationCap, label: "Manage Students", href: "/admin/students" },
      { icon: Activity, label: "Platform Analytics", href: "/admin/analytics" },
    ],
  },
  {
    group: "System",
    items: [
      { icon: Settings2, label: "Settings & Logs", href: "/admin/settings" },
    ],
  },
];

interface AppSidebarProps {
  role: "student" | "company" | "admin";
}

export default function AppSidebar({ role }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = role === "admin" ? adminNavItems : role === "student" ? studentNavItems : companyNavItems;

  const profile = role === "admin" ? {
    name: adminProfile.name,
    roleOrBranch: "Super Admin",
    initials: adminProfile.initials,
  } : role === "student" ? {
    name: studentProfile.name,
    roleOrBranch: studentProfile.branch,
    initials: studentProfile.initials,
  } : {
    name: companyProfile.recruiterName,
    roleOrBranch: companyProfile.recruiterRole,
    initials: companyProfile.recruiterInitials,
  };

  const brand = role === "admin" ? {
    name: "Hirelytics Admin",
    initials: "HA",
    color: "#111827", // dark slate for admin
  } : role === "company" ? {
    name: companyProfile.name,
    initials: companyProfile.initials,
    color: companyProfile.color,
  } : undefined;

  return (
    <>
      <aside
        className={`flex flex-col bg-sidebar h-screen sticky top-0 transition-all duration-300 ease-in-out shrink-0 z-30 ${
          collapsed ? "w-16" : role === "student" ? "w-[220px]" : "w-60"
        }`}
      >
        {/* ── Brand Header ── */}
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border shrink-0">
          {role === "student" ? (
            <>
              <div className="size-7 rounded-lg brand-gradient flex items-center justify-center shrink-0">
                <Sparkles className="size-4 text-white" />
              </div>
              {!collapsed && (
                <span className="ml-2.5 text-sm font-bold text-sidebar-foreground tracking-tight">
                  Hirelytics
                </span>
              )}
            </>
          ) : (
            <>
              {(!collapsed || role === "company") && (
                <div
                  className={`size-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm ${
                    collapsed ? "mx-auto" : ""
                  }`}
                  style={{ backgroundColor: brand?.color || "#4F46E5" }}
                >
                  {brand?.initials}
                </div>
              )}
              {!collapsed && (
                <div className="min-w-0 ml-2.5">
                  <p className="text-[13px] font-bold text-sidebar-foreground truncate leading-tight">
                    {brand?.name}
                  </p>
                  <p className="text-xs tracking-tight text-sidebar-foreground/50 truncate">
                    {role === "admin" ? "Admin Portal" : "Recruiter Portal"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── CTA Button (Company) ── */}
        {role === "company" && (
          <div className={`px-3 py-3 border-b border-sidebar-border shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
            <Link
              href="/company/drives/new"
              className={`rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center hover:opacity-90 transition-opacity ${
                collapsed ? "size-8 justify-center" : "w-full px-3 py-2 gap-2 text-xs font-semibold"
              }`}
              title={collapsed ? "Post a Drive" : undefined}
            >
              <Plus className={collapsed ? "size-4" : "size-3.5"} />
              {!collapsed && "Post a Drive"}
            </Link>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className={`flex-1 overflow-y-auto scrollbar-thin ${role === "student" ? "py-3" : "py-3 px-2"}`}>
          {navItems.map((group) => (
            <div key={group.group} className="mb-4">
              {!collapsed && (
                <p className={`mb-1 text-xs tracking-tight font-semibold uppercase tracking-widest text-sidebar-foreground/40 ${role === "student" ? "px-4" : "px-2"}`}>
                  {group.group}
                </p>
              )}
              <ul className={role === "student" ? "" : "space-y-0.5"}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const isAI = item.ai;

                  if (role === "student") {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 h-9 rounded-lg transition-all duration-150 mb-0.5 mx-2
                          ${collapsed ? "justify-center px-0 w-[44px]" : "px-3"}
                          ${
                            isActive
                              ? isAI
                                ? "ai-gradient text-white shadow-sm"
                                : "bg-sidebar-primary text-white"
                              : isAI
                              ? "text-violet-400 hover:bg-sidebar-accent hover:text-violet-300"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          }`}
                      >
                        <Icon className={`size-4 shrink-0 ${isActive ? "text-white" : isAI ? "text-violet-400" : ""}`} />
                        {!collapsed && (
                          <>
                            <span className="text-xs font-medium flex-1 text-left truncate">{item.label}</span>
                            {item.badge && (
                              <span className={`text-xs tracking-tight font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                                  isAI ? "bg-violet-500 text-white" : "bg-sidebar-foreground/10 text-sidebar-foreground/60"
                                }`}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  } else {
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium transition-colors ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          <Icon className="size-4 shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1 truncate">{item.label}</span>
                              {item.badge && (
                                <span className="text-xs tracking-tight font-semibold px-1.5 py-0.5 rounded-full bg-sidebar-accent text-sidebar-foreground/60">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </Link>
                      </li>
                    );
                  }
                })}
              </ul>
            </div>
          ))}

          {/* AI Badge for Company */}
          {role === "company" && !collapsed && (
            <div className="mx-1 mt-2 p-2.5 rounded-xl bg-sidebar-accent/60 border border-sidebar-border">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-[#8B5CF6] shrink-0" />
                <p className="text-xs font-semibold text-sidebar-foreground/80">
                  AI Ranking Active
                </p>
              </div>
              <p className="text-xs tracking-tight text-sidebar-foreground/40 mt-1 leading-relaxed">
                100 candidates ranked across 2 live drives.
              </p>
            </div>
          )}
        </nav>

        {/* ── Footer Profile ── */}
        <div className={`border-t border-sidebar-border shrink-0 ${role === "student" ? "p-3 space-y-1" : "px-3 py-3"}`}>
          <div
            className={`flex items-center ${role === "student" ? "h-10 px-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer" : ""} ${
              collapsed ? "justify-center" : "gap-2.5"
            }`}
          >
            <Avatar className="size-7 shrink-0">
              <AvatarFallback className={`text-xs tracking-tight font-bold ${role === "student" ? "brand-gradient text-white" : "bg-sidebar-accent text-sidebar-foreground"}`}>
                {profile.initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className={`${role === "student" ? "text-xs" : "text-[12px]"} font-semibold text-sidebar-foreground truncate`}>
                    {profile.name}
                  </p>
                  <p className="text-xs tracking-tight text-sidebar-foreground/50 truncate">
                    {profile.roleOrBranch}
                  </p>
                </div>
                {role === "student" ? (
                  <LogOut className="size-3.5 text-sidebar-foreground/40 hover:text-rose-400 shrink-0" />
                ) : (
                  <button className="text-sidebar-foreground/40 hover:text-sidebar-foreground/80 transition-colors">
                    <LogOut className="size-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── Collapse Toggle ── */}
      {role === "student" ? (
        <div className="relative shrink-0">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="absolute top-16 -translate-x-1/2 size-5 rounded-full bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-ring transition-all card-shadow z-40"
          >
            {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-16 -right-3 size-6 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors z-40"
          style={{ position: "relative", alignSelf: "flex-end", margin: "0 -0.75rem 0.5rem 0" }}
        >
          {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
        </button>
      )}
    </>
  );
}
