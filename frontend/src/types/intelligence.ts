export type TaskStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface CompetitorProfile {
  name: string;
  market_position: string;
  estimated_market_share: string;
  key_strengths: string[];
  key_weaknesses: string[];
  pricing_strategy: string;
  target_segment: string;
  differentiation_factor: string;
}

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface StrategicRecommendation {
  priority: 'High' | 'Medium' | 'Low';
  timeframe: string;
  title: string;
  description: string;
  expected_impact: string;
}

export interface RiskItem {
  risk_title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  likelihood: 'High' | 'Medium' | 'Low';
  mitigation_strategy: string;
}

export interface MarketOverview {
  tam?: string;
  sam?: string;
  som?: string;
  cagr?: string;
  key_trends: string[];
}

export interface SourcedCitation {
  source: string;
  title?: string;
  url?: string;
  snippet?: string;
  category?: string;
  collected_at?: string;
  confidence_score?: number;
  notes?: string;
}

export interface MarketReport {
  id: string;
  task_id: string;
  project_id?: string | null;
  title: string;
  executive_summary: string;
  market_overview: MarketOverview;
  competitor_analysis: CompetitorProfile[];
  swot_analysis: SWOTAnalysis;
  strategic_recommendations: StrategicRecommendation[];
  risk_matrix: RiskItem[];
  raw_evidence?: SourcedCitation[];
  created_at: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  level: string;
}

export interface TaskStatusResponse {
  id: string;
  company_name: string;
  industry: string;
  status: TaskStatus;
  progress_percentage: number;
  current_step: string;
  logs: LogEntry[];
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
  report_id?: string | null;
}

export interface ResearchRequestPayload {
  company_name: string;
  industry: string;
  target_competitors?: string[];
  focus_areas?: string[];
  depth?: 'quick' | 'standard' | 'comprehensive';
  project_id?: string | null;
  prompt_template_id?: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  report_count?: number;
}

export interface ReportSummary {
  id: string;
  title: string;
  executive_summary: string;
  competitor_count: number;
  recommendation_count: number;
  risk_count: number;
  evidence_count: number;
  tam?: string | null;
  cagr?: string | null;
  created_at: string;
}

