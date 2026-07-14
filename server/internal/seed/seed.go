package seed

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/normanway/architect-prep/internal/db"
)

// Run inserts 20 chapters and their knowledge points into the database.
func Run(dbPath string) error {
	database, err := db.NewDB(dbPath)
	if err != nil {
		return fmt.Errorf("connect database: %w", err)
	}
	defer database.Close()

	ctx := context.Background()

	chapterCount, pointCount := 0, 0

	for _, ch := range Chapters {
		// Insert chapter
		res, err := database.ExecContext(ctx,
			`INSERT INTO chapters (chapter_no, title, summary) VALUES (?, ?, ?)`,
			ch.ChapterNo, ch.Title, ch.Summary)
		if err != nil {
			return fmt.Errorf("insert chapter %d: %w", ch.ChapterNo, err)
		}

		chapterID, _ := res.LastInsertId()

		// Insert knowledge points
		for i, pt := range ch.Points {
			_, err := database.ExecContext(ctx,
				`INSERT INTO knowledge_points (chapter_id, title, content, sort_order) VALUES (?, ?, ?, ?)`,
				chapterID, pt.Title, pt.Content, i)
			if err != nil {
				return fmt.Errorf("insert knowledge point %s: %w", pt.Title, err)
			}
			pointCount++
		}
		chapterCount++
	}
	log.Printf("seed complete: %d chapters, %d knowledge points inserted", chapterCount, pointCount)

	// Insert test user for development
	_, _ = database.ExecContext(ctx,
		`INSERT OR IGNORE INTO users (id, email, nickname) VALUES (1, 'test@architect.dev', '测试用户')`)

	// Insert seed questions
	questionCount := 0
	for _, q := range Questions {
		optionsJSON, _ := json.Marshal(q.Options)
		answerKeysJSON, _ := json.Marshal(q.AnswerKeys)
		_, err := database.ExecContext(ctx,
			`INSERT INTO questions (chapter_id, exam_type, question_type, content, options, answer_keys, explanation, source, difficulty)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			q.ChapterID, q.ExamType, q.QuestionType, q.Content,
			string(optionsJSON), string(answerKeysJSON),
			q.Explanation, q.Source, q.Difficulty)
		if err != nil {
			return fmt.Errorf("insert question: %w", err)
		}
		questionCount++
	}
	log.Printf("seed complete: %d questions inserted", questionCount)
	return nil
}
