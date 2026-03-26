import { TrophyIcon, NewspaperIcon, CameraIcon, GraduationCapIcon, ScaleIcon } from 'lucide-react'

const audiences = [
  {
    icon: TrophyIcon,
    title: 'Photography Competitions',
    description:
      'Verify submissions against competition rules with forensic rigor. Support fair judging with evidence-based integrity assessments rather than subjective impression. Establish a defensible standard for disqualification or certification.',
    tags: ['Competition Verification', 'Submission Review'],
  },
  {
    icon: NewspaperIcon,
    title: 'Editors and Media Organizations',
    description:
      'Evaluate authenticity before publication. Identify AI-generated content, undisclosed composites, and significant manipulation in submitted or sourced imagery before it reaches your audience.',
    tags: ['Editorial Review', 'Authenticity Screening'],
  },
  {
    icon: CameraIcon,
    title: 'Photographers',
    description:
      'Validate your own work and protect your professional credibility. Obtain a certified integrity report for images submitted to competitions, clients, or legal proceedings — demonstrating transparency and professional standards.',
    tags: ['Professional Credentialing', 'Self-Verification'],
  },
  {
    icon: GraduationCapIcon,
    title: 'Educational Institutions',
    description:
      'Teach visual integrity and photographic ethics with a structured technical framework. Use the LV Authenticity Index™ as a curriculum tool for understanding image forensics, AI detection, and professional standards.',
    tags: ['Curriculum Tool', 'Visual Literacy'],
  },
  {
    icon: ScaleIcon,
    title: 'Investigators and Legal Professionals',
    description:
      'Document evidence and support legal decisions with structured, reproducible forensic reports. LVIS™ analysis follows a consistent methodology — producing reports suitable for evidentiary reference, expert consultation, and investigative documentation.',
    tags: ['Legal Reference', 'Evidentiary Documentation'],
  },
]

export function WhoUsesLVIS() {
  return (
    <section className="bg-[#060E1A] py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-[#60A5FA] text-xs font-semibold uppercase tracking-widest mb-4">
            Clients and Use Cases
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Who Uses LVIS™
          </h2>
          <p className="text-[#64748B] text-base leading-relaxed">
            LVIS™ serves professionals across photography, media, education, and law — wherever image integrity must be documented, defended, and trusted.
          </p>
        </div>

        {/* Audience cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {audiences.slice(0, 3).map((audience) => {
            const Icon = audience.icon
            return (
              <AudienceCard key={audience.title} audience={audience} Icon={Icon} />
            )
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 max-w-4xl mx-auto">
          {audiences.slice(3).map((audience) => {
            const Icon = audience.icon
            return (
              <AudienceCard key={audience.title} audience={audience} Icon={Icon} />
            )
          })}
        </div>
      </div>
    </section>
  )
}

function AudienceCard({
  audience,
  Icon,
}: {
  audience: (typeof audiences)[0]
  Icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="p-6 bg-[#0A1628] border border-white/5 rounded-xl hover:border-[#1E3A5F]/60 transition-colors group">
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#1E3A5F]/40 border border-[#2D5A8E]/30 mb-4 group-hover:bg-[#1E3A5F]/60 transition-colors">
        <Icon className="size-5 text-[#60A5FA]" />
      </div>
      <h3 className="text-white font-semibold text-base mb-2">{audience.title}</h3>
      <p className="text-[#64748B] text-sm leading-relaxed mb-4">{audience.description}</p>
      <div className="flex flex-wrap gap-2">
        {audience.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1E3A5F]/40 text-[#93C5FD] border border-[#2D5A8E]/20"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
