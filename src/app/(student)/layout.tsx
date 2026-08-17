import type { Metadata } from "next";
import AppSidebar from "@/components/layout/AppSidebar";
import TopNavbar from "@/components/layout/TopNavbar";

export const metadata: Metadata = {
  title: {
    template: "%s — Hirelytics Student",
    default: "Student Dashboard — Hirelytics",
  },
  description: "Track your campus recruitment journey with AI-powered insights on Hirelytics.",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar role="student" />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNavbar role="student" />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
