export enum InterviewStage {
  SETUP,
  ANALYZING,
  INTERVIEW,
  FEEDBACK,
  COMPLETE,
  ERROR,
}

export interface ReportResource {
  title: string;
  url: string;
  description: string;
}

export interface ReportSection {
  category: string;
  score: number;
  feedback: string;
}

export interface InterviewReport {
  sections: ReportSection[];
  overallScore: number;
  finalTip: string;
  suggestedResources: ReportResource[];
  progress_comparison: {
      improvement_summary: string;
  } | null;
  date: string; // ISO string
}


export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  isReport?: boolean;
  reportData?: InterviewReport;
}

export interface CvAnalysis {
  technical_skills: string[];
  experiences: string[];
}