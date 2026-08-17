"use client";

const palette = [
  {
    section: "Brand Primary",
    colors: [
      { name: "Indigo 800", hex: "#3730A3", textDark: true, label: "Dark Text" },
      { name: "Indigo 600", hex: "#4F46E5", textDark: true, label: "Primary Actions" },
      { name: "Indigo 500", hex: "#6366F1", textDark: true, label: "Hover State" },
      { name: "Indigo 400", hex: "#818CF8", textDark: true, label: "Tinted" },
      { name: "Indigo 100", hex: "#C7D2FE", textDark: false, label: "Subtle Tint" },
      { name: "Indigo 50", hex: "#EEF2FF", textDark: false, label: "Background Tint" },
    ],
  },
  {
    section: "AI Accent",
    colors: [
      { name: "Violet 800", hex: "#5B21B6", textDark: true, label: "AI Dark Text" },
      { name: "Violet 600", hex: "#7C3AED", textDark: true, label: "AI Hover" },
      { name: "Violet 500", hex: "#8B5CF6", textDark: true, label: "AI Primary" },
      { name: "Violet 400", hex: "#A78BFA", textDark: true, label: "AI Tinted" },
      { name: "Violet 100", hex: "#DDD6FE", textDark: false, label: "AI Subtle" },
      { name: "Violet 50", hex: "#EDE9FE", textDark: false, label: "AI Background" },
    ],
  },
  {
    section: "Admin Shell",
    colors: [
      { name: "Admin Slate", hex: "#111827", textDark: true, label: "Admin Portal BG" },
    ],
  },
  {
    section: "Neutrals",
    colors: [
      { name: "Slate 950", hex: "#020617", textDark: true, label: "Darkest" },
      { name: "Slate 900", hex: "#0F172A", textDark: true, label: "Dark BG" },
      { name: "Slate 700", hex: "#334155", textDark: true, label: "Body Text" },
      { name: "Slate 400", hex: "#94A3B8", textDark: false, label: "Muted" },
      { name: "Slate 100", hex: "#F1F5F9", textDark: false, label: "Page BG" },
    ],
  },
  {
    section: "Semantic",
    colors: [
      { name: "Emerald 500", hex: "#10B981", textDark: true, label: "Success" },
      { name: "Emerald 100", hex: "#D1FAE5", textDark: false, label: "Success BG" },
      { name: "Amber 500", hex: "#F59E0B", textDark: false, label: "Warning" },
      { name: "Amber 100", hex: "#FEF3C7", textDark: false, label: "Warning BG" },
      { name: "Rose 500", hex: "#F43F5E", textDark: true, label: "Error" },
    ],
  },
];

export default function ColorPalette() {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-6">Color Palette</h2>
      <div className="space-y-8">
        {palette.map((group) => (
          <div key={group.section}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {group.section}
            </p>
            <div className="flex flex-wrap gap-3">
              {group.colors.map((color) => (
                <div
                  key={color.hex}
                  className="flex flex-col rounded-xl overflow-hidden border border-border/50 w-32 shrink-0"
                >
                  <div
                    className="h-16 w-full"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="bg-white p-2.5">
                    <p className="text-xs font-semibold text-foreground">{color.name}</p>
                    <p className="text-xs tracking-tight font-mono text-muted-foreground">{color.hex}</p>
                    <p className="text-xs tracking-tight text-muted-foreground mt-0.5">{color.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
