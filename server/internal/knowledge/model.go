package knowledge

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

// Chapter represents a knowledge chapter in the system architect syllabus.
type Chapter struct {
	ID        int    `json:"id"`
	ChapterNo int    `json:"chapter_no"`
	Title     string `json:"title"`
	Summary   string `json:"summary"`
	ParentID  *int   `json:"parent_id,omitempty"`
}

// KnowledgePoint represents a fine-grained knowledge item under a chapter.
type KnowledgePoint struct {
	ID        int    `json:"id"`
	ChapterID int    `json:"chapter_id"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	SortOrder int    `json:"sort_order"`
}

// StringSlice is a JSON-encoded string slice stored in a SQLite TEXT column.
type StringSlice []string

// Scan implements sql.Scanner for reading a JSON TEXT value from SQLite.
func (s *StringSlice) Scan(value interface{}) error {
	if value == nil {
		*s = nil
		return nil
	}
	switch v := value.(type) {
	case string:
		return json.Unmarshal([]byte(v), s)
	case []byte:
		return json.Unmarshal(v, s)
	default:
		return fmt.Errorf("cannot scan %T into StringSlice", value)
	}
}

// Value implements driver.Valuer for writing a StringSlice as JSON TEXT.
func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return nil, nil
	}
	b, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

// Question represents an exam question associated with a chapter.
type Question struct {
	ID           int64           `json:"id"`
	ChapterID    int             `json:"chapter_id"`
	Year         *int            `json:"year,omitempty"`
	Half         *string         `json:"half,omitempty"`
	ExamType     *string         `json:"exam_type,omitempty"`
	QuestionType *string         `json:"question_type,omitempty"`
	Content      string          `json:"content"`
	Options      json.RawMessage `json:"options,omitempty"`
	AnswerKeys   StringSlice     `json:"answer_keys,omitempty"`
	Explanation  *string         `json:"explanation,omitempty"`
	Source       *string         `json:"source,omitempty"`
	Difficulty   *int            `json:"difficulty,omitempty"`
}
