"use client";

import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Code2,
  FileCode,
  Sparkles,
  Download,
  ExternalLink,
  Search,
  CheckCircle2,
  Video,
  Bookmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function StudentResourcesPage() {
  const [search, setSearch] = useState("");

  const resourceCategories = [
    {
      title: "Data Structures & Algorithms Cheatsheets",
      category: "Technical",
      items: [
        { name: "Top 75 LeetCode Patterns (Blind75 Companion)", type: "PDF / Guide", reads: "1.2k reads", badge: "Popular" },
        { name: "Dynamic Programming: 5 Essential Templates", type: "Cheatsheet", reads: "850 reads", badge: "Core" },
        { name: "Graph Traversal & Shortest Path Handbook", type: "Notes", reads: "640 reads", badge: "Essential" },
      ],
    },
    {
      title: "System Design & Architecture Primers",
      category: "System Design",
      items: [
        { name: "Designing Scalable Web Applications: Step-by-Step", type: "Guide", reads: "2.1k reads", badge: "High Yield" },
        { name: "Database Sharding & Caching Strategies", type: "Reference", reads: "920 reads", badge: "Intermediate" },
      ],
    },
    {
      title: "Behavioral & HR Interview Mastery",
      category: "Behavioral",
      items: [
        { name: "STAR Method Template with 20 Sample Answers", type: "Framework", reads: "3.4k reads", badge: "Must Read" },
        { name: "Amazon Leadership Principles Breakdown", type: "Guide", reads: "1.8k reads", badge: "FAANG" },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Placement Resources</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Curated study materials, cheatsheets, and interview playbooks to ace your drives.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/interview/int-001">
            <Button className="brand-gradient text-white font-semibold gap-2">
              <Sparkles className="size-4" /> AI Mock Interview
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search topics, cheatsheets, templates..."
          className="pl-9 h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Resource Sections */}
      <div className="space-y-6">
        {resourceCategories.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen className="size-4 text-[#4F46E5]" /> {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item, i) => (
                <Card key={i} className="card-shadow border-border/60 hover:border-[#4F46E5]/40 transition-colors">
                  <CardContent className="p-4 space-y-3 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5]">
                          {item.badge}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.reads}</span>
                      </div>
                      <p className="text-sm font-bold text-foreground line-clamp-2 leading-snug">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.type}</p>
                    </div>
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-[#4F46E5] font-semibold gap-1 px-2">
                        <Download className="size-3.5" /> Download
                      </Button>
                      <Bookmark className="size-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
