package seed

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// Run inserts 20 chapters, knowledge points, and seed questions into the database.
// Knowledge point content is loaded from markdown/chXX.md files if available,
// falling back to the plain text in data.go.
// The database must already be open; Run does not open or close it.
func Run(database *sql.DB) error {
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

		// Try to load markdown content for this chapter
		mdPath := filepath.Join("internal", "seed", "markdown", fmt.Sprintf("ch%02d.md", ch.ChapterNo))
		mdPoints, mdErr := loadMarkdownKnowledgePoints(mdPath)

		// Insert knowledge points
		for i, pt := range ch.Points {
			content := pt.Content
			// If markdown file loaded successfully, use markdown content
			if mdErr == nil && i < len(mdPoints) {
				content = mdPoints[i]
			}
			_, err := database.ExecContext(ctx,
				`INSERT INTO knowledge_points (chapter_id, title, content, sort_order) VALUES (?, ?, ?, ?)`,
				chapterID, pt.Title, content, i)
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
	// Insert knowledge cards
	cardCount := 0
	for _, card := range KnowledgeCards {
		// 查找 chapter_id by chapter_no
		var chapterID int
		err := database.QueryRowContext(ctx,
			`SELECT id FROM chapters WHERE chapter_no = ?`, card.ChapterNo).Scan(&chapterID)
		if err != nil {
			log.Printf("warning: chapter %d not found for knowledge card: %v", card.ChapterNo, err)
			continue
		}
		// 查找该章第一个 knowledge_point_id (用于 FK)
		var pointID int
		err = database.QueryRowContext(ctx,
			`SELECT id FROM knowledge_points WHERE chapter_id = ? ORDER BY sort_order LIMIT 1`, chapterID).Scan(&pointID)
		if err != nil {
			log.Printf("warning: no knowledge points for chapter %d: %v", chapterID, err)
			continue
		}
		_, err = database.ExecContext(ctx,
			`INSERT INTO knowledge_cards (id, knowledge_point_id, chapter_id, front, back, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
			cardCount+1, pointID, chapterID, card.Front, card.Back, cardCount)
		if err != nil {
			log.Printf("warning: insert knowledge card: %v", err)
			continue
		}
		cardCount++
	}
	log.Printf("seed complete: %d knowledge cards inserted", cardCount)

	// P2 fix: ensure all users have a review_item (item_type='knowledge_card', state=Learning)
	// for every knowledge_card, so the "今日复习" page can show knowledge cards.
	reviewCount, err := database.ExecContext(ctx, `
		INSERT OR IGNORE INTO review_items (user_id, item_type, item_id, state, step, due, reps, lapses)
		SELECT u.id, 'knowledge_card', kc.id, 1, 0, datetime('now'), 0, 0
		FROM users u, knowledge_cards kc
	`)
	if err != nil {
		log.Printf("warning: seed review items for knowledge cards: %v", err)
	} else {
		n, _ := reviewCount.RowsAffected()
		log.Printf("seed complete: %d knowledge card review items created", n)
	}

	// P2 fix: also migrate any pre-existing wrong_questions into review_items.
	migCount, err := database.ExecContext(ctx, `
		INSERT OR IGNORE INTO review_items (user_id, item_type, item_id, state, step, due, reps, lapses)
		SELECT user_id, 'wrong_question', question_id, 1, 0, datetime('now'), 0, 0
		FROM wrong_questions
	`)
	if err != nil {
		log.Printf("warning: migrate wrong_questions: %v", err)
	} else {
		n, _ := migCount.RowsAffected()
		if n > 0 {
			log.Printf("seed complete: %d wrong_questions migrated to review_items", n)
		}
	}
	return nil
}
// loadMarkdownKnowledgePoints reads a markdown file and splits it into knowledge points.
// Each knowledge point starts with "## Title" and is separated by "---".
// Returns a slice of markdown content strings, one per knowledge point (in order).
var headingRE = regexp.MustCompile(`^##\s+(.+)$`)
var separatorRE = regexp.MustCompile(`(?m)^---\s*$`)

func loadMarkdownKnowledgePoints(path string) ([]string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	text := string(data)

	sections := separatorRE.Split(text, -1)

	var points []string
	for _, section := range sections {
		section = strings.TrimSpace(section)
		if section == "" {
			continue
		}
		// Skip sections that are just the "## 参考文献" references
		if strings.HasPrefix(section, "## 参考文献") {
			continue
		}
		// Check if this section starts with a "## Title" heading
		lines := strings.Split(section, "\n")
		if len(lines) > 0 && headingRE.MatchString(strings.TrimSpace(lines[0])) {
			// Keep the full section including the heading
			points = append(points, section)
		}
	}

	return points, nil
}
