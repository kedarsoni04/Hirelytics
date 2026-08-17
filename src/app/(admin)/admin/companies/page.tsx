"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MoreHorizontal, ShieldCheck, Ban, Eye } from "lucide-react";
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

  const handleVerify = (id: string) => {
    console.log(`Verified company: ${id}`);
    setCompanies((prev) => prev.map(c => c.id === id ? { ...c, status: "Verified" } : c));
  };

  const handleSuspend = (id: string) => {
    console.log(`Suspended company: ${id}`);
    setCompanies((prev) => prev.map(c => c.id === id ? { ...c, status: "Suspended" } : c));
  };

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry.toLowerCase().includes(search.toLowerCase())
  );

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
      cell: (c) => {
        let bg = "bg-muted";
        let text = "text-muted-foreground";
        if (c.status === "Verified") {
          bg = "bg-[#D1FAE5]";
          text = "text-[#065F46]";
        } else if (c.status === "Pending") {
          bg = "bg-amber-100";
          text = "text-amber-700";
        } else if (c.status === "Suspended") {
          bg = "bg-rose-100";
          text = "text-rose-700";
        }
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${bg} ${text}`}>
            {c.status}
          </span>
        );
      },
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
            <DropdownMenuItem className="text-xs cursor-pointer px-0 py-0">
              <Link href={`/admin/companies/${c.id}`} className="flex items-center w-full px-1.5 py-1">
                <Eye className="size-3.5 mr-2" /> View Details
              </Link>
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
          <Button variant="outline" className="h-9 text-xs font-semibold shrink-0">
            Export CSV
          </Button>
        </div>
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
