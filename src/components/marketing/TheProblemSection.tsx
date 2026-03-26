import { AlertTriangleIcon, ScaleIcon, ImageOffIcon, TrophyIcon } from 'lucide-react'

const problems = [
  {
    icon: ImageOffIcon,
    title: 'AI-Generated Images Are Indistinguishable',
    description:
      'Modern generative AI produces synthetic images that are visually indistinguishable from authentic photographs. Without technical forensic analysis, no professional can reliably identify them by eye alone.',
  },
  {
    icon: AlertTriangleIcon,
    title: 'Manipulation Is Invisible to the Naked Eye',
    description:
      'Sophisticated retouching, cloning, compositing, and metadata stripping leave no obvious visual traces. Images routinely pass publication or legal review despite significant manipulation.',
  },
  {
    icon: TrophyIcon,
    title: 'Competitions Lack a Standard',
    description:
      'Photography competitions have no universally accepted technical standard for image evaluation. Judges rely on subjective impression rather than structured forensic evidence — creating inconsistency and dispute.',
  },
  {
    icon: ScaleIcon,
    title: 'Legal Proceedings Need Defensible Evidence',
    description:
      'Courts, investigators, and insurers require structured, reproducible documentation. An opinion is not evidence. The LV Authenticity Index™ produces a risk-scored, methodology-backed report that holds up under professional scrutiny.',
  },
]

export function TheProblemSection() {
  return (
    <section className="bg-[#0F172A] py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-[#60A5FA] text-xs font-semibold uppercase tracking-widest mb-4">
            The Challenge
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            The Problem We Solve
          </h2>
          <p className="text-[#64748B] text-lg leading-relaxed">
            In an era of AI generation and invisible manipulation, visual trust is collapsing. Professionals operating in legal, editorial, and competitive contexts need more than an opinion — they need evidence.
          </p>
        </div>

        {/* Problem cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problems.map((problem) => {
            const Icon = problem.icon
            return (
              <div
                key={problem.title}
                className="group relative p-6 bg-[#0A1628] border border-white/5 rounded-xl hover:border-[#1E3A5F]/60 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#1E3A5F]/50 border border-[#2D5A8E]/30 shrink-0 mt-0.5">
                    <Icon className="size-4.5 text-[#60A5FA]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base mb-2 leading-tight">
                      {problem.title}
                    </h3>
                    <p className="text-[#64748B] text-sm leading-relaxed">
                      {problem.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom callout */}
        <div className="mt-12 p-6 bg-[#0A1628] border border-[#1E3A5F]/40 rounded-xl text-center max-w-3xl mx-auto">
          <p className="text-[#94A3B8] text-sm leading-relaxed">
            <span className="text-white font-semibold">LVIS™</span> was created to fill this gap — a structured, methodology-driven platform that produces reproducible, evidence-based image integrity assessments professionals can rely on and cite.
          </p>
        </div>
      </div>
    </section>
  )
}
