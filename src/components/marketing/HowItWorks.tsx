import Image from 'next/image'
import {
  DatabaseIcon,
  FileCheckIcon,
  ScanEyeIcon,
  ScissorsIcon,
  BotIcon,
} from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: DatabaseIcon,
    title: 'Provenance Analysis',
    description: 'Examination of camera metadata, timestamps, GPS data, and software edit history to establish image origin and chain of custody.',
    bullets: [
      'EXIF / XMP / IPTC metadata extraction',
      'Timestamp cross-validation',
      'Camera model and firmware fingerprinting',
      'Software history reconstruction',
    ],
    result: 'Origin Confidence',
    resultColor: '#22C55E',
  },
  {
    number: '02',
    icon: FileCheckIcon,
    title: 'File Integrity Inspection',
    description: 'Low-level binary analysis of file structure, compression artifacts, and encoding anomalies to detect alteration at the file layer.',
    bullets: [
      'JPEG compression analysis',
      'File header and trailer validation',
      'Encoding inconsistency detection',
      'Hash verification against originals',
    ],
    result: 'Integrity Status',
    resultColor: '#60A5FA',
  },
  {
    number: '03',
    icon: ScanEyeIcon,
    title: 'Visual Consistency Evaluation',
    description: 'Technical assessment of lighting physics, shadow geometry, perspective consistency, and lens characteristics throughout the image.',
    bullets: [
      'Light source direction mapping',
      'Shadow geometry verification',
      'Perspective and horizon analysis',
      'Lens distortion profiling',
    ],
    result: 'Physical Coherence',
    resultColor: '#A78BFA',
  },
  {
    number: '04',
    icon: ScissorsIcon,
    title: 'Manipulation Detection',
    description: 'Identification of cloning, healing, compositing, frequency-domain anomalies, and retouching artifacts across the image surface.',
    bullets: [
      'Clone stamp and healing brush detection',
      'Error Level Analysis (ELA)',
      'Frequency domain anomaly mapping',
      'Compositing edge detection',
    ],
    result: 'Manipulation Likelihood',
    resultColor: '#F59E0B',
  },
  {
    number: '05',
    icon: BotIcon,
    title: 'Synthetic Risk Assessment',
    description: 'Evaluation of AI-generation signatures including texture regularity, noise pattern inconsistency, and generative model fingerprints.',
    bullets: [
      'AI texture pattern analysis',
      'Noise distribution mapping',
      'GAN / diffusion model fingerprinting',
      'Semantic coherence evaluation',
    ],
    result: 'Synthetic Probability',
    resultColor: '#EF4444',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-[#060E1A] py-24 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-[#60A5FA] text-xs font-semibold uppercase tracking-widest mb-4">
            Methodology
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            How LVIS™ Works
          </h2>
          <p className="text-[#64748B] text-base leading-relaxed">
            A structured methodology developed through professional photographic practice and technical analysis. Each dimension produces a scored indicator that feeds the LV Authenticity Index™.
          </p>
        </div>

        {/* Methodology showcase image */}
        <div className="mb-12 flex justify-center">
          <Image
            src="/marketing/lvis-methodology.png"
            alt="LV Authenticity Index™ methodology overview"
            width={800}
            height={400}
            className="w-full max-w-2xl object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
          />
        </div>

        {/* Steps grid — 2 cols then 3, with step 5 centered */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {steps.slice(0, 4).map((step) => {
            const Icon = step.icon
            return (
              <StepCard key={step.number} step={step} Icon={Icon} />
            )
          })}
          {/* Step 5 centered on xl */}
          <div className="md:col-span-2 xl:col-span-1 xl:col-start-2">
            <StepCard step={steps[4]} Icon={steps[4].icon} />
          </div>
        </div>

        {/* Connector note */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-[#1E3A5F]" />
          <p className="text-[#475569] text-xs text-center max-w-md">
            All five dimensions are weighted and combined to produce the final{' '}
            <span className="text-[#60A5FA] font-medium">LV Authenticity Index™</span>{' '}
            score — a single, defensible risk rating from 0 to 100.
          </p>
          <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-[#1E3A5F]" />
        </div>
      </div>
    </section>
  )
}

function StepCard({
  step,
  Icon,
}: {
  step: (typeof steps)[0]
  Icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="relative p-6 bg-[#0A1628] border border-white/5 rounded-xl hover:border-[#1E3A5F]/60 transition-colors group">
      {/* Step number watermark */}
      <span className="absolute top-4 right-4 text-5xl font-black text-[#1E3A5F]/40 font-mono leading-none select-none group-hover:text-[#1E3A5F]/60 transition-colors">
        {step.number}
      </span>

      {/* Icon */}
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#1E3A5F]/50 border border-[#2D5A8E]/30 mb-4">
        <Icon className="size-4.5 text-[#60A5FA]" />
      </div>

      {/* Title & description */}
      <h3 className="text-white font-semibold text-base mb-2 pr-10">{step.title}</h3>
      <p className="text-[#64748B] text-sm leading-relaxed mb-4">{step.description}</p>

      {/* Bullet list */}
      <ul className="space-y-1.5 mb-5">
        {step.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-[#2D5A8E] shrink-0" />
            <span className="text-[#475569] text-xs">{bullet}</span>
          </li>
        ))}
      </ul>

      {/* Result badge */}
      <div className="flex items-center gap-2">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: step.resultColor }}
        />
        <span className="text-xs font-medium" style={{ color: step.resultColor }}>
          Output: {step.result}
        </span>
      </div>
    </div>
  )
}
