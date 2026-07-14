package practice

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
)

// Repository provides data access for the practice domain.
type Repository struct {
	db *sql.DB
}

// NewRepository creates a practice repository backed by db.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

// ListQuestions returns a paginated list of questions filtered by chapter and exam type.
func (r *Repository) ListQuestions(ctx context.Context, chapterID int, examType string, page, pageSize int) (*PaginatedResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	whereClause := "WHERE 1=1"
	args := []interface{}{}

	if chapterID > 0 {
		whereClause += " AND chapter_id = ?"
		args = append(args, chapterID)
	}
	if examType != "" {
		whereClause += " AND exam_type = ?"
		args = append(args, examType)
	}

	countSQL := "SELECT COUNT(*) FROM questions " + whereClause
	var total int
	if err := r.db.QueryRowContext(ctx, countSQL, args...).Scan(&total); err != nil {
		return nil, fmt.Errorf("count questions: %w", err)
	}

	query := fmt.Sprintf(
		"SELECT id, chapter_id, year, half, exam_type, question_type, content, options, difficulty FROM questions %s ORDER BY id LIMIT ? OFFSET ?",
		whereClause,
	)
	queryArgs := append(args, pageSize, (page-1)*pageSize)
	rows, err := r.db.QueryContext(ctx, query, queryArgs...)
	if err != nil {
		return nil, fmt.Errorf("list questions: %w", err)
	}
	defer rows.Close()

	var items []QuestionListItem
	for rows.Next() {
		var q QuestionListItem
		var opts []byte
		if err := rows.Scan(&q.ID, &q.ChapterID, &q.Year, &q.Half, &q.ExamType, &q.QuestionType, &q.Content, &opts, &q.Difficulty); err != nil {
			return nil, fmt.Errorf("scan question: %w", err)
		}
		if len(opts) > 0 {
			q.Options = json.RawMessage(opts)
		}
		items = append(items, q)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate questions: %w", err)
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

// GetQuestion returns a question by id, including answer keys and explanation.
func (r *Repository) GetQuestion(ctx context.Context, id int) (*Question, error) {
	query := `SELECT id, chapter_id, year, half, exam_type, question_type, content, options, answer_keys, explanation, source, difficulty FROM questions WHERE id = ?`
	row := r.db.QueryRowContext(ctx, query, id)
	var q Question
	var opts, answerKeys []byte
	if err := row.Scan(&q.ID, &q.ChapterID, &q.Year, &q.Half, &q.ExamType, &q.QuestionType, &q.Content, &opts, &answerKeys, &q.Explanation, &q.Source, &q.Difficulty); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get question: %w", err)
	}
	if len(opts) > 0 {
		q.Options = json.RawMessage(opts)
	}
	if len(answerKeys) > 0 {
		q.AnswerKeys = json.RawMessage(answerKeys)
	}
	return &q, nil
}

// ListWrongQuestions returns the user's wrong questions with question details.
func (r *Repository) ListWrongQuestions(ctx context.Context, userID, page, pageSize int) (*PaginatedResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	var total int
	countSQL := `SELECT COUNT(*) FROM wrong_questions WHERE user_id = ?`
	if err := r.db.QueryRowContext(ctx, countSQL, userID).Scan(&total); err != nil {
		return nil, fmt.Errorf("count wrong questions: %w", err)
	}

	query := `
		SELECT wq.id, wq.user_id, wq.question_id, wq.created_at,
			q.id, q.chapter_id, q.year, q.half, q.exam_type, q.question_type, q.content, q.options, q.answer_keys, q.difficulty
		FROM wrong_questions wq
		JOIN questions q ON q.id = wq.question_id
		WHERE wq.user_id = ?
		ORDER BY wq.created_at DESC
		LIMIT ? OFFSET ?`
	rows, err := r.db.QueryContext(ctx, query, userID, pageSize, (page-1)*pageSize)
	if err != nil {
		return nil, fmt.Errorf("list wrong questions: %w", err)
	}
	defer rows.Close()

	var items []WrongQuestion
	for rows.Next() {
		var wq WrongQuestion
		var q Question
		var opts, answerKeys []byte
		if err := rows.Scan(
			&wq.ID, &wq.UserID, &wq.QuestionID, &wq.CreatedAt,
			&q.ID, &q.ChapterID, &q.Year, &q.Half, &q.ExamType, &q.QuestionType, &q.Content, &opts, &answerKeys, &q.Difficulty,
		); err != nil {
			return nil, fmt.Errorf("scan wrong question: %w", err)
		}
		if len(opts) > 0 {
			q.Options = json.RawMessage(opts)
		}
		if len(answerKeys) > 0 {
			q.AnswerKeys = json.RawMessage(answerKeys)
		}
		wq.Question = &q
		items = append(items, wq)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate wrong questions: %w", err)
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

// ListFavorites returns the user's favorited questions with question details.
func (r *Repository) ListFavorites(ctx context.Context, userID, page, pageSize int) (*PaginatedResponse, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	var total int
	countSQL := `SELECT COUNT(*) FROM favorites WHERE user_id = ?`
	if err := r.db.QueryRowContext(ctx, countSQL, userID).Scan(&total); err != nil {
		return nil, fmt.Errorf("count favorites: %w", err)
	}

	query := `
		SELECT f.id, f.user_id, f.question_id, f.created_at,
			q.id, q.chapter_id, q.year, q.half, q.exam_type, q.question_type, q.content, q.options, q.difficulty
		FROM favorites f
		JOIN questions q ON q.id = f.question_id
		WHERE f.user_id = ?
		ORDER BY f.created_at DESC
		LIMIT ? OFFSET ?`
	rows, err := r.db.QueryContext(ctx, query, userID, pageSize, (page-1)*pageSize)
	if err != nil {
		return nil, fmt.Errorf("list favorites: %w", err)
	}
	defer rows.Close()

	var items []Favorite
	for rows.Next() {
		var f Favorite
		var q Question
		var opts []byte
		if err := rows.Scan(
			&f.ID, &f.UserID, &f.QuestionID, &f.CreatedAt,
			&q.ID, &q.ChapterID, &q.Year, &q.Half, &q.ExamType, &q.QuestionType, &q.Content, &opts, &q.Difficulty,
		); err != nil {
			return nil, fmt.Errorf("scan favorite: %w", err)
		}
		if len(opts) > 0 {
			q.Options = json.RawMessage(opts)
		}
		f.Question = &q
		items = append(items, f)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate favorites: %w", err)
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

// AddFavorite inserts a favorite record, ignoring conflicts.
func (r *Repository) AddFavorite(ctx context.Context, userID, questionID int) error {
	_, err := r.db.ExecContext(ctx, `INSERT OR IGNORE INTO favorites(user_id, question_id) VALUES (?, ?)`, userID, questionID)
	if err != nil {
		return fmt.Errorf("add favorite: %w", err)
	}
	return nil
}

// RemoveFavorite deletes a favorite record.
func (r *Repository) RemoveFavorite(ctx context.Context, userID, questionID int) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM favorites WHERE user_id = ? AND question_id = ?`, userID, questionID)
	if err != nil {
		return fmt.Errorf("remove favorite: %w", err)
	}
	return nil
}

// GetStats returns overall and per-chapter correctness statistics for a user.
func (r *Repository) GetStats(ctx context.Context, userID int) (*StatsResponse, error) {
	var totalQuestions, correctCount int
	overallSQL := `SELECT COUNT(*), COALESCE(SUM(is_correct), 0) FROM practice_records WHERE user_id = ?`
	if err := r.db.QueryRowContext(ctx, overallSQL, userID).Scan(&totalQuestions, &correctCount); err != nil {
		return nil, fmt.Errorf("get overall stats: %w", err)
	}

	chapterSQL := `
		SELECT q.chapter_id,
			COUNT(*) AS total,
			COALESCE(SUM(pr.is_correct), 0) AS correct
		FROM practice_records pr
		JOIN questions q ON q.id = pr.question_id
		WHERE pr.user_id = ?
		GROUP BY q.chapter_id
		ORDER BY q.chapter_id`
	rows, err := r.db.QueryContext(ctx, chapterSQL, userID)
	if err != nil {
		return nil, fmt.Errorf("get chapter stats: %w", err)
	}
	defer rows.Close()

	var chapterStats []ChapterAccuracyResponse
	for rows.Next() {
		var cs ChapterAccuracyResponse
		if err := rows.Scan(&cs.ChapterID, &cs.TotalQuestions, &cs.CorrectCount); err != nil {
			return nil, fmt.Errorf("scan chapter stats: %w", err)
		}
		if cs.TotalQuestions > 0 {
			cs.Accuracy = float64(cs.CorrectCount) / float64(cs.TotalQuestions)
		}
		chapterStats = append(chapterStats, cs)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate chapter stats: %w", err)
	}

	accuracy := 0.0
	if totalQuestions > 0 {
		accuracy = float64(correctCount) / float64(totalQuestions)
	}

	return &StatsResponse{
		TotalQuestions: totalQuestions,
		CorrectCount:   correctCount,
		Accuracy:       accuracy,
		ChapterStats:   chapterStats,
	}, nil
}

// InsertPracticeRecord writes an answer submission record.
func (r *Repository) InsertPracticeRecord(ctx context.Context, userID, questionID int, userAnswer string, isCorrect int) error {
	_, err := r.db.ExecContext(
		ctx,
		`INSERT INTO practice_records(user_id, question_id, user_answer, is_correct) VALUES (?, ?, ?, ?)`,
		userID, questionID, userAnswer, isCorrect,
	)
	if err != nil {
		return fmt.Errorf("insert practice record: %w", err)
	}
	return nil
}

// InsertWrongQuestion records a wrong answer, ignoring conflicts.
func (r *Repository) InsertWrongQuestion(ctx context.Context, userID, questionID int) error {
	_, err := r.db.ExecContext(ctx, `INSERT OR IGNORE INTO wrong_questions(user_id, question_id) VALUES (?, ?)`, userID, questionID)
	if err != nil {
		return fmt.Errorf("insert wrong question: %w", err)
	}
	return nil
}

// DeleteWrongQuestion removes a wrong question record.
func (r *Repository) DeleteWrongQuestion(ctx context.Context, userID, questionID int) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM wrong_questions WHERE user_id = ? AND question_id = ?`, userID, questionID)
	if err != nil {
		return fmt.Errorf("delete wrong question: %w", err)
	}
	return nil
}
