package review

// ReviewItem represents a scheduled review item (wrong question or knowledge card).
type ReviewItem struct {
	ID           int64    `json:"id"`
	UserID       int      `json:"user_id"`
	ItemType     string   `json:"item_type"` // "wrong_question" | "knowledge_card"
	ItemID       int      `json:"item_id"`
	Stability    *float64 `json:"stability,omitempty"`
	Difficulty   *float64 `json:"difficulty,omitempty"`
	Step         *int     `json:"step,omitempty"`
	Due          string   `json:"due"`
	Reps         int      `json:"reps"`
	Lapses       int      `json:"lapses"`
	State        int      `json:"state"` // 1=Learning 2=Review 3=Relearning
	LastReviewAt *string  `json:"last_review_at,omitempty"`
	CreatedAt    string   `json:"created_at"`
	// Joined fields for display (populated based on item_type)
	QuestionContent *string `json:"question_content,omitempty"` // for wrong_question
	CardFront       *string `json:"card_front,omitempty"`       // for knowledge_card
	CardBack        *string `json:"card_back,omitempty"`        // for knowledge_card
	CardSource      *string `json:"card_source,omitempty"`      // 复习来源，例如 "ch3 §3.2"
}

// KnowledgeCard represents a Q&A flashcard tied to a knowledge point.
type KnowledgeCard struct {
	ID                int64  `json:"id"`
	KnowledgePointID  int    `json:"knowledge_point_id"`
	ChapterID         int    `json:"chapter_id"`
	Front             string `json:"front"`
	Back              string `json:"back"`
	Source            string `json:"source"` // 复习来源，例如 "ch3 §3.2" 或 "ch3 (跨章节)"
	SortOrder         int    `json:"sort_order"`
}

// ReviewStats holds summary statistics for the review dashboard.
type ReviewStats struct {
	DueCount      int `json:"due_count"`
	ReviewedToday int `json:"reviewed_today"`
	TotalItems    int `json:"total_items"`
}
