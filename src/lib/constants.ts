export const CATEGORY_WEIGHTS = {
  provenance: 0.25,
  file_integrity: 0.20,
  visual_consistency: 0.20,
  manipulation: 0.20,
  synthetic_risk: 0.15,
} as const

export const SCORE_BANDS = [
  { min: 0, max: 20, label: 'Authentic Capture', color: 'score-authentic', description: 'Minimal or no post-processing detected.' },
  { min: 21, max: 40, label: 'Authentic Photograph with Professional Editing', color: 'score-edited', description: 'Standard professional editing detected.' },
  { min: 41, max: 60, label: 'Significant Retouching', color: 'score-retouched', description: 'Content modification detected.' },
  { min: 61, max: 80, label: 'High Manipulation Likelihood', color: 'score-manipulated', description: 'Substantial alteration detected.' },
  { min: 81, max: 100, label: 'Synthetic or AI-Generated Risk', color: 'score-synthetic', description: 'Image authenticity uncertain.' },
] as const

export const TIER_LIMITS = {
  free: { analyses_per_month: 1, pdf_branded: false },
  pro: { analyses_per_month: 10, pdf_branded: true },
  enterprise: { analyses_per_month: Infinity, pdf_branded: true },
} as const

export const CASE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Review',
  in_review: 'In Review',
  analyzing: 'Analyzing',
  completed: 'Complete',
  rejected: 'Rejected',
}

export const CASE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  analyzing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-muted-foreground',
  normal: 'text-foreground',
  high: 'text-orange-600',
  urgent: 'text-red-600 font-semibold',
}

export const SUPPORTED_FILE_TYPES = [
  // Standard image formats
  'image/jpeg', 'image/png', 'image/tiff', 'image/heic', 'image/heif', 'image/webp',
  // RAW camera formats (MIME types vary by browser — extension-based fallback used in uploader)
  'image/x-canon-cr2', 'image/x-canon-cr3',
  'image/x-nikon-nef',
  'image/x-sony-arw',
  'image/x-adobe-dng',
  'image/x-olympus-orf',
  'image/x-panasonic-rw2',
  'image/x-fuji-raf',
  'image/x-raw',
]

export const RAW_EXTENSIONS = ['.cr2', '.cr3', '.nef', '.arw', '.dng', '.orf', '.rw2', '.raf']

export const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024 // 150MB (RAW files can be 20–80 MB)

export const LVIS_DISCLAIMER = `LVIS™ provides a professional forensic evaluation based on available file evidence, analytical indicators, and expert review. Results express assessed risk and observed findings, and do not constitute an absolute determination of truth, authorship, or legal admissibility. The LV Authenticity Index™ is a structured risk assessment tool and should be interpreted by qualified professionals in the appropriate context.`

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/app/dashboard', icon: 'LayoutDashboard' },
  { label: 'Cases', href: '/app/cases', icon: 'FolderOpen' },
  { label: 'Billing', href: '/app/billing', icon: 'CreditCard' },
] as const

export const ADMIN_NAV_ITEMS = [
  { label: 'All Cases', href: '/app/admin/cases', icon: 'FolderKanban' },
  { label: 'Clients', href: '/app/admin/clients', icon: 'Users' },
  { label: 'Reports', href: '/app/admin/reports', icon: 'FileText' },
] as const
