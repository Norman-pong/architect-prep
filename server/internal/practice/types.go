package practice

// SubmitRequest is the payload for submitting an answer.
type SubmitRequest struct {
	QuestionID int      `json:"question_id" binding:"required"`
	AnswerKeys []string `json:"answer_keys" binding:"required"`
}

// SubmitResponse is the result returned after grading an answer.
type SubmitResponse struct {
	IsCorrect         bool     `json:"is_correct"`
	CorrectAnswerKeys []string `json:"correct_answer_keys"`
	Explanation       string   `json:"explanation"`
}

// QuestionListRequest holds the query parameters for listing questions.
type QuestionListRequest struct {
	ChapterID int    `form:"chapter_id"`
	ExamType  string `form:"exam_type"`
	Page      int    `form:"page"`
	PageSize  int    `form:"page_size"`
}

// StatsResponse is the payload for user statistics.
type StatsResponse struct {
	TotalQuestions    int                       `json:"total_questions"`
	CorrectCount      int                       `json:"correct_count"`
	Accuracy          float64                   `json:"accuracy"`
	ChapterStats      []ChapterAccuracyResponse `json:"chapter_stats"`
}

// ChapterAccuracyResponse is the per-chapter correctness payload.
type ChapterAccuracyResponse struct {
	ChapterID      int     `json:"chapter_id"`
	TotalQuestions int     `json:"total_questions"`
	CorrectCount   int     `json:"correct_count"`
	Accuracy       float64 `json:"accuracy"`
}
