import type { Metadata } from "next";
import AppSidebar from "@/components/layout/AppSidebar";
import TopNavbar from "@/components/layout/TopNavbar";

export const metadata: Metadata = {
  title: { template: "%s — Hirelytics Admin", default: "Admin Portal" },
  description: "Hirelytics Super Admin Portal",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar role="admin" />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNavbar role="admin" />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
