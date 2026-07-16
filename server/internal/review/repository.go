package review

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

// Repository provides data access for the review domain.
type Repository struct {
	db *sql.DB
}

// NewRepository creates a review repository backed by db.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// GetDue returns paginated review items that are due (due <= now), with optional item_type filter.
func (r *Repository) GetDue(ctx context.Context, userID int, itemType string, page, pageSize int) (*PaginatedResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	whereClause := "WHERE ri.user_id = ? AND ri.due <= datetime('now')"
	args := []interface{}{userID}

	if itemType != "" {
		whereClause += " AND ri.item_type = ?"
		args = append(args, itemType)
	}

	countSQL := "SELECT COUNT(*) FROM review_items ri " + whereClause
	var total int
	if err := r.db.QueryRowContext(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, fmt.Errorf("count due items: %w", err)
	}

	query := fmt.Sprintf(`
		SELECT ri.id, ri.user_id, ri.item_type, ri.item_id, ri.stability, ri.difficulty, ri.step, ri.due, ri.reps, ri.lapses, ri.state, ri.last_review_at, ri.created_at,
			q.content AS question_content,
			kc.front AS card_front, kc.back AS card_back, kc.source AS card_source
		FROM review_items ri
		LEFT JOIN questions q ON ri.item_type = 'wrong_question' AND ri.item_id = q.id
		LEFT JOIN knowledge_cards kc ON ri.item_type = 'knowledge_card' AND ri.item_id = kc.id
		%s
		ORDER BY ri.due ASC
		LIMIT ? OFFSET ?`, whereClause)
	queryArgs := append(args, pageSize, (page-1)*pageSize)

	rows, err := r.db.QueryContext(ctx, query, queryArgs...)
	if err != nil {
		return nil, fmt.Errorf("list due items: %w", err)
	}
	defer rows.Close()

	var items []ReviewItem
	for rows.Next() {
		var ri ReviewItem
		var questionContent, cardFront, cardBack, cardSource sql.NullString
		var lastReviewAt, due, createdAt sql.NullString
		var step sql.NullInt64
		if err := rows.Scan(
			&ri.ID, &ri.UserID, &ri.ItemType, &ri.ItemID,
			&ri.Stability, &ri.Difficulty, &step, &due, &ri.Reps, &ri.Lapses, &ri.State,
			&lastReviewAt, &createdAt,
			&questionContent, &cardFront, &cardBack, &cardSource,
		); err != nil {
			return nil, fmt.Errorf("scan review item: %w", err)
		}
		ri.Due = normalizeTime(due)
		ri.CreatedAt = normalizeTime(createdAt)
		if step.Valid {
			s := int(step.Int64)
			ri.Step = &s
		}
		if lastReviewAt.Valid {
			s := normalizeTime(lastReviewAt)
			ri.LastReviewAt = &s
		}
		if questionContent.Valid {
			s := questionContent.String
			ri.QuestionContent = &s
		}
		if cardFront.Valid {
			s := cardFront.String
			ri.CardFront = &s
		}
		if cardBack.Valid {
			s := cardBack.String
			ri.CardBack = &s
		}
		if cardSource.Valid {
			s := cardSource.String
			ri.CardSource = &s
		}
		items = append(items, ri)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate due items: %w", err)
	}

	totalPages := 0
	if total > 0 {
		totalPages = (total + pageSize - 1) / pageSize
	}

	return &PaginatedResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// GetByItem returns a single review item by user_id + item_type + item_id.
func (r *Repository) GetByItem(ctx context.Context, userID int, itemType string, itemID int) (*ReviewItem, error) {
	var ri ReviewItem
	var lastReviewAt, due, createdAt sql.NullString
	var step sql.NullInt64
	err := r.db.QueryRowContext(ctx, `
		SELECT id, user_id, item_type, item_id, stability, difficulty, step, due, reps, lapses, state, last_review_at, created_at
		FROM review_items
		WHERE user_id = ? AND item_type = ? AND item_id = ?`,
		userID, itemType, itemID,
	).Scan(
		&ri.ID, &ri.UserID, &ri.ItemType, &ri.ItemID,
		&ri.Stability, &ri.Difficulty, &step, &due, &ri.Reps, &ri.Lapses, &ri.State,
		&lastReviewAt, &createdAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get review item: %w", err)
	}
	ri.Due = normalizeTime(due)
	ri.CreatedAt = normalizeTime(createdAt)
	if step.Valid {
		s := int(step.Int64)
		ri.Step = &s
	}
	if lastReviewAt.Valid {
		s := normalizeTime(lastReviewAt)
		ri.LastReviewAt = &s
	}
	return &ri, nil
}

// Create inserts a new review item with state=Learning and due=now, ignoring conflicts.
func (r *Repository) Create(ctx context.Context, userID int, itemType string, itemID int) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT OR IGNORE INTO review_items (user_id, item_type, item_id, state, step, due, reps, lapses) VALUES (?, ?, ?, 1, 0, datetime('now', '+' || (abs(random() % 72) + 1) || ' hours'), 0, 0)`,
		userID, itemType, itemID,
	)
	if err != nil {
		return fmt.Errorf("create review item: %w", err)
	}
	return nil
}

// Update persists all mutable fields of a review item.
func (r *Repository) Update(ctx context.Context, item *ReviewItem) error {
	var stepVal interface{}
	if item.Step != nil {
		stepVal = *item.Step
	}
	_, err := r.db.ExecContext(ctx,
		`UPDATE review_items SET stability = ?, difficulty = ?, step = ?, due = ?, reps = ?, lapses = ?, state = ?, last_review_at = ? WHERE id = ?`,
		item.Stability, item.Difficulty, stepVal, item.Due, item.Reps, item.Lapses, item.State, item.LastReviewAt, item.ID,
	)
	if err != nil {
		return fmt.Errorf("update review item: %w", err)
	}
	return nil
}

// Exists checks whether a review item exists for the given user/type/item.
func (r *Repository) Exists(ctx context.Context, userID int, itemType string, itemID int) (bool, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM review_items WHERE user_id = ? AND item_type = ? AND item_id = ?`,
		userID, itemType, itemID,
	).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("exists review item: %w", err)
	}
	return count > 0, nil
}

// GetStats returns due count, reviewed today count, and total items for a user.
func (r *Repository) GetStats(ctx context.Context, userID int) (*ReviewStats, error) {
	var stats ReviewStats
	err := r.db.QueryRowContext(ctx, `
		SELECT
			(SELECT COUNT(*) FROM review_items WHERE user_id = ? AND due <= datetime('now')) AS due_count,
			(SELECT COUNT(*) FROM review_items WHERE user_id = ? AND date(last_review_at) = date('now')) AS reviewed_today,
			(SELECT COUNT(*) FROM review_items WHERE user_id = ?) AS total_items
	`, userID, userID, userID).Scan(&stats.DueCount, &stats.ReviewedToday, &stats.TotalItems)
	if err != nil {
		return nil, fmt.Errorf("get review stats: %w", err)
	}
	return &stats, nil
}

// MigrateWrongQuestions migrates existing wrong_questions into review_items (idempotent).
func (r *Repository) MigrateWrongQuestions(ctx context.Context, userID int) (int64, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT OR IGNORE INTO review_items (user_id, item_type, item_id, state, step, due, reps, lapses)
		SELECT user_id, 'wrong_question', question_id, 1, 0, datetime('now', '+' || (abs(random() % 72) + 1) || ' hours'), 0, 0
		FROM wrong_questions
		WHERE user_id = ?
	`, userID)
	if err != nil {
		return 0, fmt.Errorf("migrate wrong_questions: %w", err)
	}
	n, _ := res.RowsAffected()
	return n, nil
}

// EnsureUserReviewItems creates review_items for every knowledge_card for the given user.
// Idempotent: uses INSERT OR IGNORE so repeated calls are safe.
func (r *Repository) EnsureUserReviewItems(ctx context.Context, userID int) (int64, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT OR IGNORE INTO review_items (user_id, item_type, item_id, state, step, due, reps, lapses)
		SELECT ?, 'knowledge_card', kc.id, 1, 0, datetime('now', '+' || (abs(random() % 72) + 1) || ' hours'), 0, 0
		FROM knowledge_cards kc
	`, userID)
	if err != nil {
		return 0, fmt.Errorf("ensure user review items: %w", err)
	}
	n, _ := res.RowsAffected()
	return n, nil
}

// normalizeTime converts any stored date format (RFC3339 or sqlite) to canonical UTC sqlite format.
func normalizeTime(v sql.NullString) string {
	if !v.Valid {
		return ""
	}
	s := v.String
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t.UTC().Format("2006-01-02 15:04:05")
	}
	if t, err := time.Parse("2006-01-02 15:04:05", s); err == nil {
		return t.UTC().Format("2006-01-02 15:04:05")
	}
	return s
}
