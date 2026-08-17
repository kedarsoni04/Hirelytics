"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MoreHorizontal, ShieldCheck, Ban, Flag, Download, Eye } from "lucide-react";
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
  const [students, setStudents] = useState(adminStudents);

  const handleClearFlag = (id: string) => {
    console.log(`Cleared flag for student: ${id}`);
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: "Active" } : s));
  };

  const handleFlag = (id: string) => {
    console.log(`Flagged student: ${id}`);
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: "Flagged" } : s));
  };

  const handleSuspend = (id: string) => {
    console.log(`Suspended student: ${id}`);
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: "Suspended" } : s));
  };

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.college.toLowerCase().includes(search.toLowerCase())
  );

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
      cell: (s) => {
        let bg = "bg-muted";
        let text = "text-muted-foreground";
        if (s.status === "Active") {
          bg = "bg-[#D1FAE5]";
          text = "text-[#065F46]";
        } else if (s.status === "Flagged") {
          bg = "bg-amber-100";
          text = "text-amber-700";
        } else if (s.status === "Suspended") {
          bg = "bg-rose-100";
          text = "text-rose-700";
        }
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${bg} ${text}`}>
            {s.status}
          </span>
        );
      },
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
            <DropdownMenuItem className="text-xs cursor-pointer px-0 py-0">
              <Link href={`/admin/students/${s.id}`} className="flex items-center w-full px-1.5 py-1">
                <Eye className="size-3.5 mr-2" /> View Profile
              </Link>
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
          <Button variant="outline" className="h-9 text-xs font-semibold shrink-0 gap-2">
            <Download className="size-3.5" /> Export List
          </Button>
          <Button className="h-9 text-xs brand-gradient text-white font-semibold shrink-0 gap-2">
            <ShieldCheck className="size-3.5" /> Bulk Verify
          </Button>
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, college..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="h-9 px-3 rounded-md border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring/50 shrink-0">
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
    </div>
  );
}
