"use client";

import { useState } from "react";
import { Search, MoreHorizontal, ShieldCheck, Ban, Eye, Building2, CheckCircle2, X, Download, Mail, Calendar, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/DataTable";
import { adminCompanies } from "@/lib/mock-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ManageCompaniesPage() {
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState(adminCompanies);
  const [selectedCompany, setSelectedCompany] = useState<(typeof adminCompanies)[0] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleVerify = (id: string) => {
    setCompanies((prev) => prev.map(c => c.id === id ? { ...c, status: "Verified" } : c));
    if (selectedCompany?.id === id) {
      setSelectedCompany(prev => prev ? { ...prev, status: "Verified" } : null);
    }
    showToast("Company verified successfully.");
  };

  const handleSuspend = (id: string) => {
    setCompanies((prev) => prev.map(c => c.id === id ? { ...c, status: "Suspended" } : c));
    if (selectedCompany?.id === id) {
      setSelectedCompany(prev => prev ? { ...prev, status: "Suspended" } : null);
    }
    showToast("Company suspended.");
  };

  const handleExportCSV = () => {
    showToast("Exporting company directory as CSV...");
  };

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    let bg = "bg-muted";
    let text = "text-muted-foreground";
    if (status === "Verified") {
      bg = "bg-[#D1FAE5]";
      text = "text-[#065F46]";
    } else if (status === "Pending") {
      bg = "bg-amber-100";
      text = "text-amber-700";
    } else if (status === "Suspended") {
      bg = "bg-rose-100";
      text = "text-rose-700";
    }
    return (
      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${bg} ${text}`}>
        {status}
      </span>
    );
  };

  const columns: Column<typeof adminCompanies[0]>[] = [
    {
      header: "Company",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-muted flex items-center justify-center font-bold text-foreground text-xs shrink-0">
            {c.logo}
          </div>
          <span className="font-bold text-foreground">{c.name}</span>
        </div>
      ),
    },
    {
      header: "Industry",
      accessorKey: "industry",
    },
    {
      header: "Status",
      cell: (c) => getStatusBadge(c.status),
    },
    {
      header: "Active Drives",
      cell: (c) => (
        <span className="font-medium text-foreground">{c.activeDrives}</span>
      ),
    },
    {
      header: "Joined",
      accessorKey: "joined",
    },
    {
      header: "",
      className: "w-[50px]",
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-center size-8 rounded-md hover:bg-accent hover:text-accent-foreground outline-none">
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedCompany(c)} className="text-xs cursor-pointer">
              <Eye className="size-3.5 mr-2" /> View Details
            </DropdownMenuItem>
            {c.status !== "Verified" && (
              <DropdownMenuItem onClick={() => handleVerify(c.id)} className="text-xs text-emerald-600 focus:text-emerald-600 cursor-pointer">
                <ShieldCheck className="size-3.5 mr-2" /> Verify Account
              </DropdownMenuItem>
            )}
            {c.status !== "Suspended" && (
              <DropdownMenuItem onClick={() => handleSuspend(c.id)} className="text-xs text-rose-600 focus:text-rose-600 cursor-pointer">
                <Ban className="size-3.5 mr-2" /> Suspend Account
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* ── Header & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Companies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View, verify, and manage registered employers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="h-9 text-xs font-semibold shrink-0 gap-1.5">
            <Download className="size-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* ── Data Table ── */}
      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(item) => item.id}
      />

      {/* ── Company Details Modal / Drawer ── */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 space-y-6 animate-in zoom-in-95 duration-150 relative">
            <button
              onClick={() => setSelectedCompany(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground size-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="size-12 rounded-xl bg-muted flex items-center justify-center font-bold text-foreground text-lg shrink-0">
                {selectedCompany.logo}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{selectedCompany.name}</h2>
                  {getStatusBadge(selectedCompany.status)}
                </div>
                <p className="text-xs text-muted-foreground">{selectedCompany.industry} · Employer ID: {selectedCompany.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                  <Briefcase className="size-3.5 text-[#4F46E5]" /> Active Drives
                </p>
                <p className="text-lg font-bold text-foreground mt-1">{selectedCompany.activeDrives} Drives</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-[#4F46E5]" /> Onboarded
                </p>
                <p className="text-lg font-bold text-foreground mt-1">{selectedCompany.joined}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-foreground">Recruiter Contact</p>
              <div className="flex items-center gap-2 text-muted-foreground p-2.5 rounded-lg bg-muted/30 border border-border/40">
                <Mail className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">recruiter@{selectedCompany.name.toLowerCase().replace(/\s+/g, "")}.com</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border gap-2">
              <div className="flex gap-2">
                {selectedCompany.status !== "Verified" && (
                  <Button
                    onClick={() => handleVerify(selectedCompany.id)}
                    size="sm"
                    className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                  >
                    <ShieldCheck className="size-3.5" /> Verify
                  </Button>
                )}
                {selectedCompany.status !== "Suspended" && (
                  <Button
                    onClick={() => handleSuspend(selectedCompany.id)}
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 text-rose-600 hover:bg-rose-50 border-rose-200 gap-1.5"
                  >
                    <Ban className="size-3.5" /> Suspend
                  </Button>
                )}
              </div>
              <Button onClick={() => setSelectedCompany(null)} variant="outline" size="sm" className="text-xs h-8">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

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

