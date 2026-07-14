// Shared types for the knowledge feature

export interface Chapter {
  id: number;
  chapter_no: number;
  title: string;
  summary: string;
  parent_id?: number | null;
}

export interface KnowledgePoint {
  id: number;
  chapter_id: number;
  title: string;
  content: string;
  sort_order: number;
}

export interface LearningProgress {
  total_points: number;
  mastered_points: number;
  coverage: number; // 0.0 - 1.0
  per_chapter: Array<{
    chapter_id: number;
    total: number;
    mastered: number;
  }>;
  mastered_point_ids: number[];
  last_progress: {
    chapter_id: number;
    point_id: number;
    title: string;
  } | null;
}

export interface PointStatus {
  point_id: number;
  mastered: boolean;
  view_count: number;
  first_viewed_at: string;
  last_viewed_at: string;
}
