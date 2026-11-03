export type MathCategory = 'Calculus' | 'Algebra' | 'Linear Algebra' | 'Differential Equations' | 'Trigonometry';

export type TutorActionType =
  | 'start'
  | 'why_did_we_do_that'
  | 'hint'
  | 'check_step'
  | 'next_step'
  | 'general_chat'
  | 'check_scratchpad';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: number;
  actionType?: TutorActionType;
  stepIndex?: number;
  isDeepDive?: boolean;
  scratchpadThumbnail?: string;
  thoughtSummary?: string;
  modelUsed?: string;
}

export interface ProblemAnalysis {
  problemTitle: string;
  category: MathCategory;
  latexProblem: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  milestones: string[];
  firstStepGuidance: string;
  detectedText?: string;
}

export interface SampleProblem {
  id: string;
  title: string;
  category: MathCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  latex: string;
  description: string;
  thumbnailBadge: string;
}
