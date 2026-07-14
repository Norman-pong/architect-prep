// Shared types for practice feature, matching backend model.go / types.go

export interface Question {
  id: number;
  chapter_id: number;
  exam_type?: string;
  question_type?: string;
  content: string;
  options?: string[];
  answer_keys?: string[];
  explanation?: string;
  difficulty?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface WrongQuestion {
  id: number;
  user_id: number;
  question_id: number;
  created_at: string;
  question?: Question;
}

export interface ChapterStat {
  chapter_id: number;
  total_questions: number;
  correct_count: number;
  accuracy: number;
}

export interface PracticeStats {
  total_questions: number;
  correct_count: number;
  accuracy: number;
  chapter_stats: ChapterStat[];
}

export interface SubmitResponse {
  is_correct: boolean;
  correct_answer_keys: string[];
  explanation: string;
}
