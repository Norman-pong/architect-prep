package learning

// LearningRecord represents a user's learning activity for a knowledge point.
type LearningRecord struct {
	ID            int64   `json:"id"`
	UserID        int     `json:"user_id"`
	PointID       int     `json:"point_id"`
	ChapterID     int     `json:"chapter_id"`
	FirstViewedAt string  `json:"first_viewed_at"`
	LastViewedAt  string  `json:"last_viewed_at"`
	ViewCount     int     `json:"view_count"`
	Mastered      int     `json:"mastered"`
	MasteredAt    *string `json:"mastered_at,omitempty"`
}

// LastProgress tracks the most recently viewed knowledge point for a user.
type LastProgress struct {
	UserID    int    `json:"user_id"`
	ChapterID int    `json:"chapter_id"`
	PointID   int    `json:"point_id"`
	UpdatedAt string `json:"updated_at"`
}

// ChapterProgress holds per-chapter learning statistics.
type ChapterProgress struct {
	ChapterID int `json:"chapter_id"`
	Total     int `json:"total"`
	Mastered  int `json:"mastered"`
}

// LastProgressResponse is the last viewed point data returned in progress.
type LastProgressResponse struct {
	ChapterID int    `json:"chapter_id"`
	PointID   int    `json:"point_id"`
	Title     string `json:"title"`
}

// ProgressResponse is the payload for the GET /progress endpoint.
type ProgressResponse struct {
	TotalPoints     int                   `json:"total_points"`
	MasteredPoints  int                   `json:"mastered_points"`
	Coverage        float64               `json:"coverage"`
	PerChapter      []ChapterProgress     `json:"per_chapter"`
	MasteredPointIDs []int                `json:"mastered_point_ids"`
	LastProgress    *LastProgressResponse `json:"last_progress,omitempty"`
}

// PointStatus is the payload for the GET /points/:point_id endpoint.
type PointStatus struct {
	PointID       int     `json:"point_id"`
	Mastered      bool    `json:"mastered"`
	ViewCount     int     `json:"view_count"`
	FirstViewedAt string  `json:"first_viewed_at"`
	LastViewedAt  string  `json:"last_viewed_at"`
}

// MasterRequest is the payload for toggling mastered state.
type MasterRequest struct {
	Mastered bool `json:"mastered"`
}
