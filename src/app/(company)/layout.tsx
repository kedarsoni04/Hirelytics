import type { Metadata } from "next";
import AppSidebar from "@/components/layout/AppSidebar";
import TopNavbar from "@/components/layout/TopNavbar";

export const metadata: Metadata = {
  title: { template: "%s — Hirelytics Recruiter", default: "Recruiter Portal" },
  description: "Hirelytics Company & Recruiter Portal",
};

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar role="company" />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNavbar role="company" />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
