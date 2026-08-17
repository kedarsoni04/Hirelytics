"use client";

const typeScale = [
  {
    name: "Display",
    class: "text-4xl font-bold tracking-tight text-foreground",
    size: "36px / 700",
    sample: "Hire Smarter, Grow Faster",
  },
  {
    name: "H1",
    class: "text-3xl font-bold tracking-tight text-foreground",
    size: "30px / 700",
    sample: "Campus Recruitment Platform",
  },
  {
    name: "H2",
    class: "text-2xl font-semibold text-foreground",
    size: "24px / 600",
    sample: "Active Recruitment Drives",
  },
  {
    name: "H3",
    class: "text-xl font-semibold text-foreground",
    size: "20px / 600",
    sample: "Company Profile Overview",
  },
  {
    name: "H4",
    class: "text-base font-semibold text-foreground",
    size: "16px / 600",
    sample: "Application Status",
  },
  {
    name: "Body",
    class: "text-sm text-foreground",
    size: "14px / 400",
    sample: "Review your application and ensure all required documents are uploaded before the deadline.",
  },
  {
    name: "Small",
    class: "text-xs text-muted-foreground",
    size: "12px / 400",
    sample: "Last updated 2 hours ago · 142 applicants",
  },
  {
    name: "Caption / Label",
    class: "text-xs tracking-tight uppercase tracking-widest font-medium text-muted-foreground",
    size: "10px / 500",
    sample: "AI ANALYZED · VERIFIED RECRUITER",
  },
];

export default function TypographyScale() {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-6">Typography Scale</h2>
      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {typeScale.map((t) => (
          <div
            key={t.name}
            className="flex items-start gap-6 px-6 py-5 bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="w-32 shrink-0">
              <p className="text-xs font-medium text-foreground">{t.name}</p>
              <p className="text-xs tracking-tight font-mono text-muted-foreground mt-0.5">{t.size}</p>
            </div>
            <p className={t.class}>{t.sample}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
