package knowledge

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

// Repository provides data access for the knowledge domain.
type Repository struct {
	db *sql.DB
}

// NewRepository creates a knowledge repository backed by db.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// ListChapters returns all chapters ordered by chapter number and id.
func (r *Repository) ListChapters(ctx context.Context) ([]Chapter, error) {
	query := `SELECT id, chapter_no, title, summary, parent_id FROM chapters ORDER BY chapter_no, id`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list chapters: %w", err)
	}
	defer rows.Close()

	var chapters []Chapter
	for rows.Next() {
		var c Chapter
		if err := rows.Scan(&c.ID, &c.ChapterNo, &c.Title, &c.Summary, &c.ParentID); err != nil {
			return nil, fmt.Errorf("scan chapter: %w", err)
		}
		chapters = append(chapters, c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate chapters: %w", err)
	}
	return chapters, nil
}

// GetChapter returns a chapter by id, or nil if not found.
func (r *Repository) GetChapter(ctx context.Context, id int) (*Chapter, error) {
	query := `SELECT id, chapter_no, title, summary, parent_id FROM chapters WHERE id = ?`
	row := r.db.QueryRowContext(ctx, query, id)
	var c Chapter
	if err := row.Scan(&c.ID, &c.ChapterNo, &c.Title, &c.Summary, &c.ParentID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get chapter: %w", err)
	}
	return &c, nil
}

// ListKnowledgePoints returns all knowledge points for a given chapter.
func (r *Repository) ListKnowledgePoints(ctx context.Context, chapterID int) ([]KnowledgePoint, error) {
	query := `SELECT id, chapter_id, title, content, sort_order FROM knowledge_points WHERE chapter_id = ? ORDER BY sort_order, id`
	rows, err := r.db.QueryContext(ctx, query, chapterID)
	if err != nil {
		return nil, fmt.Errorf("list knowledge points: %w", err)
	}
	defer rows.Close()

	var points []KnowledgePoint
	for rows.Next() {
		var kp KnowledgePoint
		if err := rows.Scan(&kp.ID, &kp.ChapterID, &kp.Title, &kp.Content, &kp.SortOrder); err != nil {
			return nil, fmt.Errorf("scan knowledge point: %w", err)
		}
		points = append(points, kp)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate knowledge points: %w", err)
	}
	return points, nil
}

// SearchKnowledgePoints searches knowledge points by title or content using a
// case-insensitive pattern match.
func (r *Repository) SearchKnowledgePoints(ctx context.Context, query string) ([]KnowledgePoint, error) {
	pattern := "%" + query + "%"
	sql := `SELECT id, chapter_id, title, content, sort_order FROM knowledge_points WHERE title LIKE ? OR content LIKE ? ORDER BY sort_order, id`
	rows, err := r.db.QueryContext(ctx, sql, pattern, pattern)
	if err != nil {
		return nil, fmt.Errorf("search knowledge points: %w", err)
	}
	defer rows.Close()

	var points []KnowledgePoint
	for rows.Next() {
		var kp KnowledgePoint
		if err := rows.Scan(&kp.ID, &kp.ChapterID, &kp.Title, &kp.Content, &kp.SortOrder); err != nil {
			return nil, fmt.Errorf("scan knowledge point: %w", err)
		}
		points = append(points, kp)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate knowledge points: %w", err)
	}
	return points, nil
}
