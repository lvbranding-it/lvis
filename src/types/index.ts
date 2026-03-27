// User & Auth
export type UserRole = 'admin' | 'client'
export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  subscription_tier: SubscriptionTier
  wave_customer_id: string | null
  analyses_override: number | null
  company_name: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

// Cases
export type CaseStatus = 'pending' | 'in_review' | 'analyzing' | 'completed' | 'rejected'
export type CasePriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Case {
  id: string
  case_number: string
  client_id: string
  assigned_to: string | null
  title: string
  description: string | null
  purpose: string | null
  status: CaseStatus
  priority: CasePriority
  due_date: string | null
  client_notes: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  // Joined relations
  client?: Profile
  assignee?: Profile
  case_files?: CaseFile[]
  forensic_review?: ForensicReview | null
  report?: Report | null
}

export interface CaseFile {
  id: string
  case_id: string
  storage_path: string
  file_name: string
  file_type: string
  file_size: number
  width: number | null
  height: number | null
  checksum: string | null
  created_at: string
}

// Analysis
export type AnalysisStatus = 'pending' | 'running' | 'complete' | 'failed'
export type ConfidenceLevel = 'low' | 'medium' | 'high'

export interface CategoryScore {
  score: number // 0-100
  confidence: ConfidenceLevel
  findings: string[]
  narrative: string
}

export interface ClaudeFindings {
  provenance: CategoryScore
  file_integrity: CategoryScore
  visual_consistency: CategoryScore
  manipulation: CategoryScore
  synthetic_risk: CategoryScore
  overall_observations: string
  recommended_actions: string[]
}

export interface TechnicalEvidence {
  exiftool: {
    provenance_score: number
    integrity_score: number
    flags: string[]
    raw: Record<string, unknown>
  }
  opencv: {
    manipulation_score: number
    ela_score: number
    ela_map_base64: string | null
    noise_uniformity_score: number
    clone_score: number
    flagged_regions: Array<{ x: number; y: number; w: number; h: number; type: string }>
  }
  pillow: {
    integrity_score: number
    integrity_flags: string[]
  }
  technical_provenance_floor: number
  technical_integrity_floor: number
  technical_manipulation_floor: number
  /** Chain-of-custody: captured from the HTTP request at analysis time */
  analysis_context?: {
    ip?: string
    city?: string
    country?: string
    timezone?: string
    user_agent?: string
  }
  /** JPEG conversion from RAW input — used to pass to Claude when original was a RAW camera file */
  converted_jpeg_base64?: string
}

export interface ForensicReview {
  id: string
  case_id: string
  case_file_id: string
  technical_evidence: TechnicalEvidence
  claude_findings: ClaudeFindings
  provenance_score: number
  file_integrity_score: number
  visual_consistency_score: number
  manipulation_score: number
  synthetic_risk_score: number
  total_score: number
  classification: string
  confidence_level: ConfidenceLevel
  analysis_status: AnalysisStatus
  error_message: string | null
  analyzed_at: string | null
  created_at: string
}

// Reports
export interface Report {
  id: string
  case_id: string
  forensic_review_id: string | null
  storage_path: string | null
  version: number
  delivered_at: string | null
  created_at: string
}

// Subscriptions
export interface Subscription {
  id: string
  user_id: string
  wave_customer_id: string | null
  wave_invoice_id: string | null
  tier: SubscriptionTier
  status: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
}

// Scoring
export interface CategoryScores {
  provenance: number
  file_integrity: number
  visual_consistency: number
  manipulation: number
  synthetic_risk: number
}

export interface LVIndexResult {
  total_score: number
  classification: string
  confidence_level: ConfidenceLevel
  weighted_breakdown: CategoryScores
}

// API
export interface ApiError {
  error: string
  code?: string
}

export interface AnalyzeRequest {
  caseFileId: string
}

export interface AnalyzeResponse {
  forensicReviewId: string
  totalScore: number
  classification: string
  reportUrl?: string
}
