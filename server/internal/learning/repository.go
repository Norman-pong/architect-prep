package learning

import (
	"context"
	"database/sql"
	"fmt"
)

// Repository provides data access for the learning domain.
type Repository struct {
	db *sql.DB
}

// NewRepository creates a learning repository backed by db.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// getChapterIDForPoint looks up the chapter_id for a given knowledge point.
func (r *Repository) getChapterIDForPoint(ctx context.Context, pointID int) (int, error) {
	var chapterID int
	query := `SELECT chapter_id FROM knowledge_points WHERE id = ?`
	if err := r.db.QueryRowContext(ctx, query, pointID).Scan(&chapterID); err != nil {
		if err == sql.ErrNoRows {
			return 0, fmt.Errorf("knowledge point not found")
		}
		return 0, fmt.Errorf("get chapter id for point: %w", err)
	}
	return chapterID, nil
}

// RecordView upserts a learning record (increment view_count, update last_viewed_at)
// and upserts last_progress for the user.
func (r *Repository) RecordView(ctx context.Context, userID, pointID int) error {
	chapterID, err := r.getChapterIDForPoint(ctx, pointID)
	if err != nil {
		return err
	}

	recordSQL := `
		INSERT INTO learning_records (user_id, point_id, chapter_id, first_viewed_at, last_viewed_at, view_count, mastered)
		VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 0)
		ON CONFLICT(user_id, point_id) DO UPDATE SET
			last_viewed_at = CURRENT_TIMESTAMP,
			view_count = view_count + 1
	`
	if _, err := r.db.ExecContext(ctx, recordSQL, userID, pointID, chapterID); err != nil {
		return fmt.Errorf("upsert learning record: %w", err)
	}

	progressSQL := `
		INSERT INTO last_progress (user_id, chapter_id, point_id, updated_at)
		VALUES (?, ?, ?, CURRENT_TIMESTAMP)
		ON CONFLICT(user_id) DO UPDATE SET
			chapter_id = excluded.chapter_id,
			point_id = excluded.point_id,
			updated_at = CURRENT_TIMESTAMP
	`
	if _, err := r.db.ExecContext(ctx, progressSQL, userID, chapterID, pointID); err != nil {
		return fmt.Errorf("upsert last progress: %w", err)
	}

	return nil
}

// ToggleMastered updates the mastered state for a user's learning record.
func (r *Repository) ToggleMastered(ctx context.Context, userID, pointID int, mastered bool) error {
	var query string
	var args []interface{}
	if mastered {
		query = `
			UPDATE learning_records
			SET mastered = 1, mastered_at = CURRENT_TIMESTAMP
			WHERE user_id = ? AND point_id = ?
		`
		args = []interface{}{userID, pointID}
	} else {
		query = `
			UPDATE learning_records
			SET mastered = 0, mastered_at = NULL
			WHERE user_id = ? AND point_id = ?
		`
		args = []interface{}{userID, pointID}
	}
	res, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("toggle mastered: %w", err)
	}
	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("check rows affected: %w", err)
	}
	if rowsAffected == 0 {
		// No existing record; insert one with view_count=0
		chapterID, err := r.getChapterIDForPoint(ctx, pointID)
		if err != nil {
			return err
		}
		var insertSQL string
		var insertArgs []interface{}
		if mastered {
			insertSQL = `
				INSERT INTO learning_records (user_id, point_id, chapter_id, first_viewed_at, last_viewed_at, view_count, mastered, mastered_at)
				VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 1, CURRENT_TIMESTAMP)
			`
			insertArgs = []interface{}{userID, pointID, chapterID}
		} else {
			insertSQL = `
				INSERT INTO learning_records (user_id, point_id, chapter_id, first_viewed_at, last_viewed_at, view_count, mastered, mastered_at)
				VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0, NULL)
			`
			insertArgs = []interface{}{userID, pointID, chapterID}
		}
		if _, err := r.db.ExecContext(ctx, insertSQL, insertArgs...); err != nil {
			return fmt.Errorf("insert learning record on toggle: %w", err)
		}
	}
	return nil
}
// GetProgress returns overall and per-chapter learning progress for a user.
func (r *Repository) GetProgress(ctx context.Context, userID int) (*ProgressResponse, error) {
	// Total count of all knowledge points in the system
	var totalPoints int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM knowledge_points`).Scan(&totalPoints); err != nil {
		return nil, fmt.Errorf("get total knowledge points: %w", err)
	}

	// Count of mastered points for this user
	var masteredPoints int
	if err := r.db.QueryRowContext(ctx, `SELECT COALESCE(SUM(mastered), 0) FROM learning_records WHERE user_id = ?`, userID).Scan(&masteredPoints); err != nil {
		return nil, fmt.Errorf("get mastered points: %w", err)
	}

	// Per-chapter breakdown: all chapters with knowledge point counts and mastered counts
	chapterSQL := `
		SELECT
			c.id AS chapter_id,
			COUNT(kp.id) AS total,
			COALESCE(SUM(CASE WHEN lr.mastered = 1 THEN 1 ELSE 0 END), 0) AS mastered
		FROM chapters c
		JOIN knowledge_points kp ON kp.chapter_id = c.id
		LEFT JOIN learning_records lr ON lr.point_id = kp.id AND lr.user_id = ?
		GROUP BY c.id
		ORDER BY c.id
	`
	rows, err := r.db.QueryContext(ctx, chapterSQL, userID)
	if err != nil {
		return nil, fmt.Errorf("get chapter progress: %w", err)
	}
	defer rows.Close()

	var perChapter []ChapterProgress
	for rows.Next() {
		var cp ChapterProgress
		if err := rows.Scan(&cp.ChapterID, &cp.Total, &cp.Mastered); err != nil {
			return nil, fmt.Errorf("scan chapter progress: %w", err)
		}
		perChapter = append(perChapter, cp)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate chapter progress: %w", err)
	}

	// Last progress with point title
	var lastProgress *LastProgressResponse
	lastSQL := `
		SELECT lp.chapter_id, lp.point_id, kp.title
		FROM last_progress lp
		JOIN knowledge_points kp ON kp.id = lp.point_id
		WHERE lp.user_id = ?
	`
	var lp LastProgressResponse
	if err := r.db.QueryRowContext(ctx, lastSQL, userID).Scan(&lp.ChapterID, &lp.PointID, &lp.Title); err != nil {
		if err != sql.ErrNoRows {
			return nil, fmt.Errorf("get last progress: %w", err)
		}
	} else {
		lastProgress = &lp
	}

	// Mastered point IDs for per-point status display
	masteredIDSQL := `SELECT point_id FROM learning_records WHERE user_id = ? AND mastered = 1`
	idRows, err := r.db.QueryContext(ctx, masteredIDSQL, userID)
	if err != nil {
		return nil, fmt.Errorf("get mastered point ids: %w", err)
	}
	defer idRows.Close()

	var masteredPointIDs []int
	for idRows.Next() {
		var pid int
		if err := idRows.Scan(&pid); err != nil {
			return nil, fmt.Errorf("scan mastered point id: %w", err)
		}
		masteredPointIDs = append(masteredPointIDs, pid)
	}
	if err := idRows.Err(); err != nil {
		return nil, fmt.Errorf("iterate mastered point ids: %w", err)
	}
	if masteredPointIDs == nil {
		masteredPointIDs = []int{}
	}
	coverage := 0.0
	if totalPoints > 0 {
		coverage = float64(masteredPoints) / float64(totalPoints)
	}

	return &ProgressResponse{
		TotalPoints:      totalPoints,
		MasteredPoints:   masteredPoints,
		Coverage:         coverage,
		PerChapter:       perChapter,
		MasteredPointIDs: masteredPointIDs,
		LastProgress:     lastProgress,
	}, nil
}

// GetPointStatus returns the learning status for a single knowledge point.
func (r *Repository) GetPointStatus(ctx context.Context, userID, pointID int) (*PointStatus, error) {
	query := `
		SELECT point_id, mastered, view_count, first_viewed_at, last_viewed_at
		FROM learning_records
		WHERE user_id = ? AND point_id = ?
	`
	var ps PointStatus
	var masteredInt int
	if err := r.db.QueryRowContext(ctx, query, userID, pointID).Scan(
		&ps.PointID, &masteredInt, &ps.ViewCount, &ps.FirstViewedAt, &ps.LastViewedAt,
	); err != nil {
		if err == sql.ErrNoRows {
			return &PointStatus{
				PointID:       pointID,
				Mastered:      false,
				ViewCount:     0,
				FirstViewedAt: "",
				LastViewedAt:  "",
			}, nil
		}
		return nil, fmt.Errorf("get point status: %w", err)
	}
	ps.Mastered = masteredInt == 1
	return &ps, nil
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
