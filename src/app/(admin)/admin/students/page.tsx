"use client";

import { useState } from "react";
import { Search, MoreHorizontal, ShieldCheck, Ban, Flag, Download, Eye, GraduationCap, CheckCircle2, X, Mail, BookOpen, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/ui/DataTable";
import { adminStudents } from "@/lib/mock-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ManageStudentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [students, setStudents] = useState(adminStudents);
  const [selectedStudent, setSelectedStudent] = useState<(typeof adminStudents)[0] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleClearFlag = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: "Active" } : s));
    if (selectedStudent?.id === id) {
      setSelectedStudent(prev => prev ? { ...prev, status: "Active" } : null);
    }
    showToast("Student flag cleared successfully.");
  };

  const handleFlag = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: "Flagged" } : s));
    if (selectedStudent?.id === id) {
      setSelectedStudent(prev => prev ? { ...prev, status: "Flagged" } : null);
    }
    showToast("Student account flagged for review.");
  };

  const handleSuspend = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: "Suspended" } : s));
    if (selectedStudent?.id === id) {
      setSelectedStudent(prev => prev ? { ...prev, status: "Suspended" } : null);
    }
    showToast("Student account suspended.");
  };

  const handleExportList = () => {
    showToast("Exporting student directory as CSV...");
  };

  const handleBulkVerify = () => {
    setStudents(prev => prev.map(s => s.status === "Flagged" ? { ...s, status: "Active" } : s));
    showToast("Bulk verified all active student records.");
  };

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.college.toLowerCase().includes(search.toLowerCase()) ||
      s.branch.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    let bg = "bg-muted";
    let text = "text-muted-foreground";
    if (status === "Active") {
      bg = "bg-[#D1FAE5]";
      text = "text-[#065F46]";
    } else if (status === "Flagged") {
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

  const columns: Column<typeof adminStudents[0]>[] = [
    {
      header: "Student Name",
      cell: (s) => (
        <span className="font-bold text-foreground">{s.name}</span>
      ),
    },
    {
      header: "College",
      accessorKey: "college",
    },
    {
      header: "Branch",
      accessorKey: "branch",
    },
    {
      header: "CGPA",
      cell: (s) => (
        <span className="font-medium text-foreground">{s.cgpa}</span>
      ),
    },
    {
      header: "Status",
      cell: (s) => getStatusBadge(s.status),
    },
    {
      header: "Applications",
      cell: (s) => (
        <span className="font-medium text-foreground">{s.applications}</span>
      ),
    },
    {
      header: "",
      className: "w-[50px]",
      cell: (s) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-center size-8 rounded-md hover:bg-accent hover:text-accent-foreground outline-none">
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedStudent(s)} className="text-xs cursor-pointer">
              <Eye className="size-3.5 mr-2" /> View Profile
            </DropdownMenuItem>
            {s.status === "Flagged" && (
              <DropdownMenuItem onClick={() => handleClearFlag(s.id)} className="text-xs text-emerald-600 focus:text-emerald-600 cursor-pointer">
                <ShieldCheck className="size-3.5 mr-2" /> Clear Flag
              </DropdownMenuItem>
            )}
            {s.status !== "Flagged" && s.status !== "Suspended" && (
              <DropdownMenuItem onClick={() => handleFlag(s.id)} className="text-xs text-amber-600 focus:text-amber-600 cursor-pointer">
                <Flag className="size-3.5 mr-2" /> Flag Account
              </DropdownMenuItem>
            )}
            {s.status !== "Suspended" && (
              <DropdownMenuItem onClick={() => handleSuspend(s.id)} className="text-xs text-rose-600 focus:text-rose-600 cursor-pointer">
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
      
      {/* ── Header & Bulk Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Students</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor student accounts, flagging, and bulk operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExportList} variant="outline" className="h-9 text-xs font-semibold shrink-0 gap-2">
            <Download className="size-3.5" /> Export List
          </Button>
          <Button onClick={handleBulkVerify} className="h-9 text-xs brand-gradient text-white font-semibold shrink-0 gap-2">
            <ShieldCheck className="size-3.5" /> Bulk Verify
          </Button>
        </div>
      </div>

      {/* ── Search & Responsive Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, college, branch..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring/50 shrink-0"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Flagged">Flagged</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      {/* ── Data Table ── */}
      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(item) => item.id}
      />

      {/* ── Student Profile Details Modal / Drawer ── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-150">
          <div className="bg-white rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 space-y-6 animate-in zoom-in-95 duration-150 relative">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground size-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="size-12 rounded-xl brand-gradient flex items-center justify-center font-bold text-white text-lg shrink-0">
                <GraduationCap className="size-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{selectedStudent.name}</h2>
                  {getStatusBadge(selectedStudent.status)}
                </div>
                <p className="text-xs text-muted-foreground">{selectedStudent.branch} · {selectedStudent.college}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                  <Award className="size-3.5 text-[#4F46E5]" /> Academic CGPA
                </p>
                <p className="text-lg font-bold text-foreground mt-1">{selectedStudent.cgpa} / 10.0</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                  <BookOpen className="size-3.5 text-[#4F46E5]" /> Active Drives
                </p>
                <p className="text-lg font-bold text-foreground mt-1">{selectedStudent.applications} Applications</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-foreground">Student Contact & Verification</p>
              <div className="flex items-center gap-2 text-muted-foreground p-2.5 rounded-lg bg-muted/30 border border-border/40">
                <Mail className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">
                  {selectedStudent.name.toLowerCase().replace(/\s+/g, ".")}@{selectedStudent.college.toLowerCase().replace(/[^a-z0-9]/g, "")}.edu
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border gap-2">
              <div className="flex gap-2">
                {selectedStudent.status === "Flagged" && (
                  <Button
                    onClick={() => handleClearFlag(selectedStudent.id)}
                    size="sm"
                    className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                  >
                    <ShieldCheck className="size-3.5" /> Clear Flag
                  </Button>
                )}
                {selectedStudent.status !== "Flagged" && selectedStudent.status !== "Suspended" && (
                  <Button
                    onClick={() => handleFlag(selectedStudent.id)}
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 text-amber-600 hover:bg-amber-50 border-amber-200 gap-1.5"
                  >
                    <Flag className="size-3.5" /> Flag
                  </Button>
                )}
                {selectedStudent.status !== "Suspended" && (
                  <Button
                    onClick={() => handleSuspend(selectedStudent.id)}
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 text-rose-600 hover:bg-rose-50 border-rose-200 gap-1.5"
                  >
                    <Ban className="size-3.5" /> Suspend
                  </Button>
                )}
              </div>
              <Button onClick={() => setSelectedStudent(null)} variant="outline" size="sm" className="text-xs h-8">
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

