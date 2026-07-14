package review

// GradeRequest is the payload for grading a review item.
type GradeRequest struct {
	ItemType string `json:"item_type" binding:"required"`
	ItemID   int    `json:"item_id" binding:"required"`
	Rating   int    `json:"rating" binding:"required,min=1,max=4"` // 1=Again 2=Hard 3=Good 4=Easy
}

// GradeResponse is the result after FSRS scheduling update.
type GradeResponse struct {
	Due        string   `json:"due"`
	State      int      `json:"state"`
	Stability  *float64 `json:"stability,omitempty"`
	Difficulty *float64 `json:"difficulty,omitempty"`
}

// DueListRequest holds query params for the due list endpoint.
type DueListRequest struct {
	ItemType string `form:"item_type"` // optional filter: "wrong_question" | "knowledge_card"
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
}

// PaginatedResponse wraps a list result with pagination metadata.
type PaginatedResponse struct {
	Items      interface{} `json:"items"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}
