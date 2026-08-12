import type { LangCode } from "@/lib/languages";
import type { ProviderName } from "@/lib/constants";

export type Role = "interviewer" | "participant";

export interface Message {
  id: string;
  interviewId: string;
  role: Role;
  text: string;
  createdAt: string;
  questionCategory?: string | null;
  isFollowup?: boolean;
  provider?: string | null;
}

/** Structured research summary extracted from the full transcript. */
export interface ResearchSummary {
  mainChallenge?: string;
  realSituation?: string;
  currentSolution?: string;
  mainFrustration?: string;
  desiredImprovement?: string;
  estimatedLevel?: string;
  mainLearningProblems: string[];
  realLifeSituations: string[];
  currentLearningMethods: string[];
  frustrations: string[];
  desiredOutcomes: string[];
  existingPaidSolutions: string[];
  payingInterest?: string;
  importantQuotes: string[];
  otherInsights: string[];
}

export interface Interview {
  id: string;
  status: "in_progress" | "completed" | "abandoned";
  language: LangCode;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  generatedSummary: ResearchSummary | null;
  provider: string | null;
}

export interface InterviewWithMessages extends Interview {
  messages: Message[];
}

/** Response shape of the interviewer's next question decision. */
export interface InterviewerDecision {
  question: string;
  category?: string;
  isFollowup: boolean;
  endInterview: boolean;
}

export type ProviderTag = ProviderName | "mixed" | null;
