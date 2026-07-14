// Types for FSRS review system.
// ReviewItem mirrors backend model.ReviewItem; ReviewStats and GradeResponse
// mirror backend /review/stats and /review/grade response payloads.
// PaginatedResponse<T> matches the existing /practice list shape so the
// hooks can share a single type.

export interface ReviewItem {
  id: number;
  user_id: number;
  item_type: 'wrong_question' | 'knowledge_card';
  item_id: number;
  stability?: number;
  difficulty?: number;
  due: string;
  reps: number;
  lapses: number;
  state: number;
  last_review_at?: string;
  created_at: string;
  question_content?: string;
  card_front?: string;
  card_back?: string;
}

export interface ReviewStats {
  due_count: number;
  reviewed_today: number;
  total_items: number;
}

export interface GradeResponse {
  due: string;
  state: number;
  stability?: number;
  difficulty?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
