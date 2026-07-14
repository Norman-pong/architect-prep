package practice

import "encoding/json"

// Question represents an exam question associated with a chapter.
type Question struct {
	ID           int64           `json:"id"`
	ChapterID    *int            `json:"chapter_id,omitempty"`
	Year         *int            `json:"year,omitempty"`
	Half         *string         `json:"half,omitempty"`
	ExamType     *string         `json:"exam_type,omitempty"`
	QuestionType *string         `json:"question_type,omitempty"`
	Content      string          `json:"content"`
	Options      json.RawMessage `json:"options,omitempty"`
	AnswerKeys   json.RawMessage `json:"answer_keys,omitempty"`
	Explanation  *string         `json:"explanation,omitempty"`
	Source       *string         `json:"source,omitempty"`
	Difficulty   *int            `json:"difficulty,omitempty"`
}

// QuestionListItem represents a lightweight question item for list views.
// It omits the explanation and correct answer keys.
type QuestionListItem struct {
	ID           int64           `json:"id"`
	ChapterID    *int            `json:"chapter_id,omitempty"`
	Year         *int            `json:"year,omitempty"`
	Half         *string         `json:"half,omitempty"`
	ExamType     *string         `json:"exam_type,omitempty"`
	QuestionType *string         `json:"question_type,omitempty"`
	Content      string          `json:"content"`
	Options      json.RawMessage `json:"options,omitempty"`
	Difficulty   *int            `json:"difficulty,omitempty"`
}

// PracticeRecord represents a single answer submission attempt.
type PracticeRecord struct {
	ID         int64  `json:"id"`
	UserID     int    `json:"user_id"`
	QuestionID int    `json:"question_id"`
	UserAnswer string `json:"user_answer"`
	IsCorrect  int    `json:"is_correct"`
	CreatedAt  string `json:"created_at"`
}

// WrongQuestion represents a question the user answered incorrectly.
type WrongQuestion struct {
	ID         int64   `json:"id"`
	UserID     int     `json:"user_id"`
	QuestionID int     `json:"question_id"`
	CreatedAt  string  `json:"created_at"`
	Question   *Question `json:"question,omitempty"`
}

// Favorite represents a question the user has favorited.
type Favorite struct {
	ID         int64   `json:"id"`
	UserID     int     `json:"user_id"`
	QuestionID int     `json:"question_id"`
	CreatedAt  string  `json:"created_at"`
	Question   *Question `json:"question,omitempty"`
}

// UserStats holds overall statistics for a user.
type UserStats struct {
	TotalQuestions     int                   `json:"total_questions"`
	CorrectCount       int                   `json:"correct_count"`
	Accuracy           float64               `json:"accuracy"`
	ChapterAccuracies  []ChapterAccuracy     `json:"chapter_accuracies"`
}

// ChapterAccuracy holds per-chapter correctness statistics.
type ChapterAccuracy struct {
	ChapterID        int     `json:"chapter_id"`
	TotalQuestions   int     `json:"total_questions"`
	CorrectCount     int     `json:"correct_count"`
	Accuracy         float64 `json:"accuracy"`
}

// PaginatedResponse wraps a list result with pagination metadata.
type PaginatedResponse struct {
	Items       interface{} `json:"items"`
	Total       int         `json:"total"`
	Page        int         `json:"page"`
	PageSize    int         `json:"page_size"`
	TotalPages  int         `json:"total_pages"`
}
