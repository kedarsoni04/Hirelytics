import { resumeData } from "@/lib/mock-data";
import { Globe, GitBranch, Mail, Phone, MapPin } from "lucide-react";

export default function ResumePreview() {
  const { personal, education, experience, skills, projects, achievements } = resumeData;

  return (
    <div className="bg-white text-[#0F172A] font-sans text-xs leading-relaxed rounded-xl overflow-hidden border border-border card-shadow">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight">{personal.name}</h1>
        <p className="text-xs text-[#4F46E5] font-semibold mt-0.5">{personal.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs tracking-tight text-muted-foreground">
          <span className="flex items-center gap-1"><Mail className="size-3" />{personal.email}</span>
          <span className="flex items-center gap-1"><Phone className="size-3" />{personal.phone}</span>
          <span className="flex items-center gap-1"><MapPin className="size-3" />{personal.location}</span>
          <span className="flex items-center gap-1"><Globe className="size-3" />{personal.linkedin}</span>
          <span className="flex items-center gap-1"><GitBranch className="size-3" />{personal.github}</span>
        </div>
        <p className="text-xs tracking-tight text-muted-foreground mt-2 leading-relaxed">{personal.summary}</p>
      </div>

      {/* Body */}
      <div className="px-6 py-4 space-y-4">

        {/* Education */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4F46E5] border-b border-border pb-0.5 mb-2">
            Education
          </h2>
          {education.map((edu, i) => (
            <div key={i} className="flex justify-between gap-2 mb-1.5">
              <div>
                <p className="font-semibold text-xs">{edu.institution}</p>
                <p className="text-xs tracking-tight text-muted-foreground">{edu.degree}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs tracking-tight text-muted-foreground whitespace-nowrap">{edu.period}</p>
                <p className="text-xs tracking-tight font-semibold text-[#10B981]">{edu.score}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Experience */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4F46E5] border-b border-border pb-0.5 mb-2">
            Experience
          </h2>
          {experience.map((exp, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-xs">{exp.role}</p>
                  <p className="text-xs tracking-tight text-muted-foreground">{exp.company} · {exp.location}</p>
                </div>
                <p className="text-xs tracking-tight text-muted-foreground shrink-0">{exp.period}</p>
              </div>
              <ul className="mt-1 space-y-0.5">
                {exp.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-xs tracking-tight text-[#334155]">
                    <span className="size-1 rounded-full bg-[#4F46E5] mt-1.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Projects */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4F46E5] border-b border-border pb-0.5 mb-2">
            Projects
          </h2>
          {projects.map((proj, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between">
                <div>
                  <span className="font-semibold text-xs">{proj.name}</span>
                  <span className="text-xs tracking-tight text-[#8B5CF6] ml-1.5">{proj.tech}</span>
                </div>
                <p className="text-xs tracking-tight text-muted-foreground shrink-0">{proj.period}</p>
              </div>
              <ul className="mt-0.5 space-y-0.5">
                {proj.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-xs tracking-tight text-[#334155]">
                    <span className="size-1 rounded-full bg-[#4F46E5] mt-1.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Skills */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4F46E5] border-b border-border pb-0.5 mb-2">
            Skills
          </h2>
          <div className="space-y-1">
            <div className="flex gap-1.5 flex-wrap">
              <span className="font-semibold text-xs tracking-tight text-[#334155] w-20 shrink-0">Languages</span>
              {skills.languages.map(s => <span key={s} className="text-xs tracking-tight text-muted-foreground">{s} ·</span>)}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className="font-semibold text-xs tracking-tight text-[#334155] w-20 shrink-0">Frameworks</span>
              {skills.frameworks.map(s => <span key={s} className="text-xs tracking-tight text-muted-foreground">{s} ·</span>)}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className="font-semibold text-xs tracking-tight text-[#334155] w-20 shrink-0">Tools</span>
              {skills.tools.map(s => <span key={s} className="text-xs tracking-tight text-muted-foreground">{s} ·</span>)}
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4F46E5] border-b border-border pb-0.5 mb-2">
            Achievements
          </h2>
          <ul className="space-y-0.5">
            {achievements.map((a, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs tracking-tight text-[#334155]">
                <span className="size-1 rounded-full bg-[#4F46E5] mt-1.5 shrink-0" />
                {a}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
