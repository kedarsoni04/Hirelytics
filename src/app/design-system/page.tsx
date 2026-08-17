import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";
import ColorPalette from "@/components/design-system/ColorPalette";
import TypographyScale from "@/components/design-system/TypographyScale";
import ButtonShowcase from "@/components/design-system/ButtonShowcase";
import BadgeShowcase from "@/components/design-system/BadgeShowcase";
import CardShowcase from "@/components/design-system/CardShowcase";
import InputShowcase from "@/components/design-system/InputShowcase";
import NavbarPreview from "@/components/design-system/NavbarPreview";
import SidebarPreview from "@/components/design-system/SidebarPreview";

export const metadata: Metadata = {
  title: "Design System — Hirelytics",
  description:
    "Hirelytics UI design system: color palette, typography, components, and patterns used across the platform.",
};

const sections = [
  "Color Palette",
  "Typography",
  "Buttons",
  "Badges & Tags",
  "Cards",
  "Inputs",
  "Navbar",
  "Sidebar",
];

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Page header */}
      <div className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg brand-gradient flex items-center justify-center">
              <Sparkles className="size-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground tracking-tight">Hirelytics</span>
              <span className="text-muted-foreground text-sm">/</span>
              <span className="text-sm text-muted-foreground font-medium">Design System</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            {sections.map((s, i) => (
              <a
                key={s}
                href={`#${s.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                className="px-2 py-1 rounded hover:bg-accent hover:text-foreground transition-colors"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl brand-gradient flex items-center justify-center shrink-0">
              <Sparkles className="size-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Design System</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full ai-gradient text-white">v1.0</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                The single source of truth for Hirelytics UI. All components, tokens, and patterns used
                across the Super Admin, Company/Recruiter, and Student modules.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                {[
                  { label: "Next.js 15", color: "#000" },
                  { label: "Tailwind CSS v4", color: "#38BDF8" },
                  { label: "shadcn/ui", color: "#18181B" },
                  { label: "Framer Motion", color: "#FF4154" },
                ].map((tech) => (
                  <span
                    key={tech.label}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg bg-accent text-accent-foreground border border-border"
                  >
                    {tech.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">

        <div id="color-palette">
          <ColorPalette />
        </div>

        <Separator />

        <div id="typography">
          <TypographyScale />
        </div>

        <Separator />

        <div id="buttons">
          <ButtonShowcase />
        </div>

        <Separator />

        <div id="badges-tags">
          <BadgeShowcase />
        </div>

        <Separator />

        <div id="cards">
          <CardShowcase />
        </div>

        <Separator />

        <div id="inputs">
          <InputShowcase />
        </div>

        <Separator />

        <div id="navbar">
          <NavbarPreview />
        </div>

        <Separator />

        <div id="sidebar">
          <SidebarPreview />
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Hirelytics Design System · Built with Next.js + Tailwind CSS v4 + shadcn/ui (Nova preset)
          </p>
        </div>

      </div>
    </div>
  );
}
