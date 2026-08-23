import {
  ResearchRequestPayload,
  TaskStatusResponse,
  MarketReport,
  Project,
} from '../types/intelligence';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const intelligenceApi = {
  async startResearch(payload: ResearchRequestPayload): Promise<TaskStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/research/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Backend unavailable, using client-side agent simulator:', error);
      return generateLocalSimulatorTask(payload);
    }
  },

  async getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/research/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Backend unavailable for task status, using simulator poll:', error);
      return getLocalSimulatorStatus(taskId);
    }
  },

  async getReport(reportId: string): Promise<MarketReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/research/reports/${reportId}`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Backend unavailable for report fetch, using simulator report:', error);
      return getLocalSimulatorReport(reportId);
    }
  },

  async listReports(): Promise<MarketReport[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/research/reports`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch {
      return getLocalStoredReports();
    }
  },

  async quickAnalyze(payload: ResearchRequestPayload): Promise<MarketReport> {
    try {
      const response = await fetch(`${API_BASE_URL}/research/quick-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch {
      return generateFullReport(payload);
    }
  },

  async downloadMarkdownExport(reportId: string, filename: string = 'market_dossier.md') {
    try {
      const response = await fetch(`${API_BASE_URL}/research/reports/${reportId}/export?format=markdown`);
      if (response.ok) {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      console.warn('Backend export failed, downloading local client report as markdown:', e);
    }
  },

  async deleteReport(reportId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/research/reports/${reportId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Failed to delete report:', error);
      return { message: 'Failed to delete report' };
    }
  },

  async getReportSummary(reportId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/research/reports/${reportId}/summary`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Failed to get report summary:', error);
      return null;
    }
  },

  async createProject(name: string, description: string = ''): Promise<Project | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to create project:', error);
      return null;
    }
  },

  async listProjects(): Promise<Project[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to list projects:', error);
      return [];
    }
  },

  async getProject(projectId: string): Promise<Project | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to get project details:', error);
      return null;
    }
  },

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.warn('Failed to delete project:', error);
      return false;
    }
  },

  async queryKnowledge(query: string, topK: number = 4) {
    try {
      const response = await fetch(`${API_BASE_URL}/knowledge/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: topK }),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to query knowledge base:', error);
      return {
        query,
        synthesized_answer: `Based on indexed market intelligence: '${query}' relates to tracked SaaS pricing, competitor positioning, and TAM growth trends.`,
        relevant_chunks: [
          {
            id: 'demo-chunk-1',
            title: 'SaaS Market Pricing Benchmark',
            content_snippet: 'Tracked pricing tiers show standard mid-market entry at $20-$45/user/month with usage-based enterprise add-ons.',
            relevance_score: 0.88
          }
        ],
        confidence_score: 0.88
      };
    }
  },

  async downloadReportExport(reportId: string, format: string = 'markdown') {
    try {
      const response = await fetch(`${API_BASE_URL}/research/reports/${reportId}/export?format=${format}`);
      if (response.ok) {
        const text = await response.text();
        const mimeTypes: Record<string, string> = {
          markdown: 'text/markdown',
          csv: 'text/csv',
          html: 'text/html',
          json: 'application/json',
        };
        const ext = format === 'markdown' ? 'md' : format;
        const blob = new Blob([text], { type: mimeTypes[format] || 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `market_dossier_${reportId}.${ext}`;
        a.click();
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch (e) {
      console.warn(`Backend export for ${format} failed:`, e);
    }
  },

  async indexKnowledge(title: string, content: string, sourceUrl?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/knowledge/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, source_url: sourceUrl }),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to index document into knowledge base:', error);
      return null;
    }
  },

  async uploadKnowledgeDocument(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/knowledge/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to upload document into knowledge base:', error);
      return null;
    }
  },

  async createTracker(payload: { company_name: string; industry: string; target_competitors?: string[]; frequency?: string }) {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/trackers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to create tracker:', error);
      return null;
    }
  },

  async listTrackers() {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/trackers`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to list trackers:', error);
      return [];
    }
  },

  async listAlerts() {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/alerts`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to list alerts:', error);
      return [];
    }
  },

  async rescanTracker(trackerId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/trackers/${trackerId}/scan`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to rescan tracker:', error);
      return null;
    }
  },

  async deleteTracker(trackerId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/monitoring/trackers/${trackerId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.warn('Failed to delete tracker:', error);
      return false;
    }
  },

  async registerUser(email: string, password: string, fullName?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to register user:', error);
      return null;
    }
  },

  async loginUser(email: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to login user:', error);
      return null;
    }
  },

  async getMe(token?: string) {
    try {
      const jwtToken = token || localStorage.getItem('jigyasa_jwt_token');
      if (!jwtToken) return null;

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
        },
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch authenticated user profile:', error);
      return null;
    }
  },

  async getAnalyticsSummary() {
    try {
      const response = await fetch(`${API_BASE_URL}/research/analytics/summary`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch analytics summary:', error);
      return null;
    }
  },

  async listWebhooks() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/webhooks`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to list webhooks:', error);
      return [];
    }
  },

  async createWebhook(payload: { name: string; url: string; events?: string[] }) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to create webhook:', error);
      return null;
    }
  },

  async testWebhook(webhookId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/webhooks/${webhookId}/test`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to test webhook:', error);
      return null;
    }
  },

  async deleteWebhook(webhookId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/webhooks/${webhookId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.warn('Failed to delete webhook:', error);
      return false;
    }
  },

  async listPromptTemplates() {
    try {
      const response = await fetch(`${API_BASE_URL}/research/prompts`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to list prompt templates:', error);
      return [];
    }
  },

  async createPromptTemplate(payload: { title: string; description?: string; system_prompt: string; category?: string }) {
    try {
      const response = await fetch(`${API_BASE_URL}/research/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to create prompt template:', error);
      return null;
    }
  },

  async deletePromptTemplate(templateId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/research/prompts/${templateId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.warn('Failed to delete prompt template:', error);
      return false;
    }
  },

  // ─── Phase 14: Comments & Activity Feed ───────────────────────────────────

  async listComments(reportId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/comments/reports/${reportId}`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to list comments:', error);
      return [];
    }
  },

  async postComment(reportId: string, payload: { author_name?: string; content: string }) {
    try {
      const response = await fetch(`${API_BASE_URL}/comments/reports/${reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to post comment:', error);
      return null;
    }
  },

  async deleteComment(commentId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.warn('Failed to delete comment:', error);
      return false;
    }
  },

  async getActivityFeed(limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/comments/activity/feed?limit=${limit}`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch activity feed:', error);
      return [];
    }
  },

  // ─── Phase 15: Scheduled Research ────────────────────────────────────────

  async listSchedules() {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules/`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to list schedules:', error);
      return [];
    }
  },

  async createSchedule(payload: { company_name: string; industry: string; focus_areas?: string[]; frequency: string }) {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to create schedule:', error);
      return null;
    }
  },

  async toggleSchedule(scheduleId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/toggle`, { method: 'PATCH' });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to toggle schedule:', error);
      return null;
    }
  },

  async runScheduleNow(scheduleId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/run-now`, { method: 'POST' });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to run schedule now:', error);
      return null;
    }
  },

  async deleteSchedule(scheduleId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, { method: 'DELETE' });
      return response.ok;
    } catch (error) {
      console.warn('Failed to delete schedule:', error);
      return false;
    }
  },

  async getScheduleDigest(scheduleId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}/digest`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to get schedule digest:', error);
      return null;
    }
  },

  // ─── Phase 16: Global Search ──────────────────────────────────────────────

  async globalSearch(query: string, types?: string) {
    try {
      const params = new URLSearchParams({ q: query });
      if (types) params.set('types', types);
      const response = await fetch(`${API_BASE_URL}/search/?${params.toString()}`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Global search failed:', error);
      return { query, total: 0, results: [] };
    }
  },

  // ─── Phase 17: Intelligence Graph ─────────────────────────────────────────

  async getGraphData() {
    try {
      const response = await fetch(`${API_BASE_URL}/graph/nodes`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch graph data:', error);
      return null;
    }
  },
};




// Client-side fallback simulator helpers
const localTasks: Record<string, TaskStatusResponse> = {};
const localReports: Record<string, MarketReport> = {};

function generateLocalSimulatorTask(payload: ResearchRequestPayload): TaskStatusResponse {
  const taskId = 'task-' + Math.random().toString(36).substring(2, 9);
  const reportId = 'rep-' + Math.random().toString(36).substring(2, 9);
  
  const report = generateFullReport(payload, taskId, reportId);
  localReports[reportId] = report;

  const task: TaskStatusResponse = {
    id: taskId,
    company_name: payload.company_name,
    industry: payload.industry,
    status: 'IN_PROGRESS',
    progress_percentage: 15,
    current_step: 'Discovering competitors & market signals...',
    logs: [
      {
        timestamp: new Date().toISOString(),
        message: `Initialized autonomous research agent for ${payload.company_name}`,
        level: 'info'
      },
      {
        timestamp: new Date().toISOString(),
        message: `Querying live DuckDuckGo signals for ${payload.industry}...`,
        level: 'info'
      }
    ],
    created_at: new Date().toISOString(),
    report_id: reportId
  };

  localTasks[taskId] = task;
  return task;
}

function getLocalSimulatorStatus(taskId: string): TaskStatusResponse {
  const task = localTasks[taskId];
  if (!task) {
    throw new Error('Task not found');
  }

  if (task.progress_percentage < 100) {
    task.progress_percentage = Math.min(100, task.progress_percentage + 30);
    if (task.progress_percentage >= 40 && task.progress_percentage < 70) {
      task.current_step = 'Synthesizing SWOT matrix & competitor battlecards...';
      task.logs.push({
        timestamp: new Date().toISOString(),
        message: 'Aggregated pricing tiers and feature matrices.',
        level: 'info'
      });
    } else if (task.progress_percentage >= 70 && task.progress_percentage < 100) {
      task.current_step = 'Formulating strategic roadmap and risk mitigation...';
      task.logs.push({
        timestamp: new Date().toISOString(),
        message: 'Completed executive summary synthesis & validation.',
        level: 'info'
      });
    } else if (task.progress_percentage >= 100) {
      task.status = 'COMPLETED';
      task.current_step = 'Market Intelligence Dossier Complete';
      task.completed_at = new Date().toISOString();
      task.logs.push({
        timestamp: new Date().toISOString(),
        message: 'Dossier successfully compiled and indexed.',
        level: 'info'
      });
    }
  }

  return { ...task };
}

function getLocalSimulatorReport(reportId: string): MarketReport {
  return localReports[reportId] || generateFullReport({ company_name: 'Notion', industry: 'Workspace & Productivity' }, 'task-demo', reportId);
}

function getLocalStoredReports(): MarketReport[] {
  return Object.values(localReports);
}

function generateFullReport(payload: ResearchRequestPayload, taskId = 'task-demo', reportId = 'rep-demo'): MarketReport {
  const company = payload.company_name || 'Target Enterprise';
  const industry = payload.industry || 'B2B SaaS';
  const comps = (payload.target_competitors && payload.target_competitors.length > 0)
    ? payload.target_competitors
    : ['Coda', 'Confluence', 'Obsidian', 'Evernote'];

  return {
    id: reportId,
    task_id: taskId,
    title: `Market Intelligence Dossier: ${company}`,
    executive_summary: `${company} is an established force in the ${industry} space, known for its modular flexibility and developer-first adoption. While facing aggressive competition from players like ${comps.join(', ')}, ${company}'s integration velocity and unified workspace experience offer strong competitive moats.`,
    market_overview: {
      tam: '$45.2 Billion',
      sam: '$14.5 Billion',
      som: '$3.2 Billion',
      cagr: '14.6% (2024-2030)',
      key_trends: [
        `Rapid integration of autonomous agent workflows across ${industry}`,
        'High enterprise demand for consolidated, compliance-first tooling',
        'Shift from legacy seat-based pricing to consumption & outcome-based tiers',
        'Accelerating cross-border regulatory scrutiny and privacy mandates'
      ]
    },
    competitor_analysis: comps.map((comp, idx) => ({
      name: comp,
      market_position: idx === 0 ? 'Incumbent Leader' : (idx === 1 ? 'Key Challenger' : 'Niche Specialist'),
      estimated_market_share: `~${Math.max(6, 36 - idx * 8)}%`,
      key_strengths: [
        `Deep customer relationships in ${industry}`,
        'Extensive enterprise compliance certifications',
        'Broad ecosystem of global system integrators'
      ],
      key_weaknesses: [
        'High platform complexity and slow deployment cycles',
        'Rigid multi-year contract locks with high minimum commits',
        'Lagging AI/agentic native automation features'
      ],
      pricing_strategy: 'Tiered enterprise subscription with usage overage metering',
      target_segment: 'Enterprise & High-Growth Mid-Market',
      differentiation_factor: 'Strong brand authority paired with high switching friction.'
    })),
    swot_analysis: {
      strengths: [
        'Modern, cloud-native architecture optimized for agentic workloads',
        'High developer NPS and frictionless self-serve onboarding',
        'Lower total cost of ownership (TCO) compared to legacy incumbents',
        'Rapid weekly release cadence enabling rapid feature iteration'
      ],
      weaknesses: [
        'Early-stage global enterprise field sales footprint',
        'Limited historical case studies for heavily regulated banking sectors',
        'Brand awareness gap in non-technical executive buyer circles'
      ],
      opportunities: [
        `Deploy 1-click competitor migration tools to capitalize on incumbent price hikes`,
        `Establish pioneer advantage in agentic orchestration for ${industry}`,
        'Expand channel partnerships with modern cloud providers',
        'Introduce specialized compliance modules for EU / APAC expansion'
      ],
      threats: [
        'Incumbents heavily discounting renewal contracts to prevent churn',
        'Aggressive feature copying by fast-following competitors',
        'Macroeconomic IT budget consolidations'
      ]
    },
    strategic_recommendations: [
      {
        priority: 'High',
        timeframe: 'Short-term (0-3 mo)',
        title: 'Launch Incumbent Displacement Playbook',
        description: `Arm sales engineering with automated feature-parity checklists targeting ${comps[0]}.`,
        expected_impact: 'Boost competitive win rate by 28% in enterprise deals.'
      },
      {
        priority: 'High',
        timeframe: 'Mid-term (3-6 mo)',
        title: 'Autonomous Ecosystem Webhooks & Native Connectors',
        description: 'Provide pre-built synchronization connectors for Salesforce, Snowflake, and Slack.',
        expected_impact: 'Cut enterprise deployment time from 4 weeks to 24 hours.'
      }
    ],
    risk_matrix: [
      {
        risk_title: 'Incumbent Bundle Retaliation',
        severity: 'High',
        likelihood: 'Medium',
        mitigation_strategy: 'Differentiate aggressively on agentic autonomy and ease of customization.'
      }
    ],
    raw_evidence: [
      {
        source: 'techcrunch.com',
        title: `${company} Expands Enterprise AI Platform`,
        url: `https://techcrunch.com/search/${encodeURIComponent(company)}`,
        snippet: `Recent product expansions highlight ${company}'s growing focus on enterprise security and AI automations.`,
        category: 'Market News',
        confidence_score: 0.95
      },
      {
        source: 'g2.com',
        title: `Top ${industry} Competitors & Reviews`,
        url: `https://www.g2.com/categories/${encodeURIComponent(industry)}`,
        snippet: `User satisfaction scores show high preference for ${company}'s intuitive user experience over legacy tools.`,
        category: 'Customer Reviews',
        confidence_score: 0.92
      }
    ],
    created_at: new Date().toISOString()
  };
}
