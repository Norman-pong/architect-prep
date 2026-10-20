package review

import (
	"context"
	"fmt"
	"time"

	fsrs "github.com/imxw/go-fsrs"
)

// Service provides business logic for the review domain using FSRS scheduling.
type Service struct {
	repo      *Repository
	scheduler *fsrs.Scheduler
}

// NewService creates a review service backed by repo.
func NewService(repo *Repository) *Service {
	return &Service{
		repo:      repo,
		scheduler: fsrs.NewScheduler(),
	}
}

// sqliteTimeFormat is the canonical persisted format for all time fields
// in review_items. Using UTC + a fixed format makes lexicographic text
// comparison in SQL match chronological order.
const sqliteTimeFormat = "2006-01-02 15:04:05"

// GradeCard grades a review item using FSRS and updates the schedule.
func (s *Service) GradeCard(ctx context.Context, userID int, itemType string, itemID int, rating int) (*GradeResponse, error) {
	ri, err := s.repo.GetByItem(ctx, userID, itemType, itemID)
	if err != nil {
		return nil, err
	}
	if ri == nil {
		return nil, fmt.Errorf("review item not found")
	}

	// Parse due time — always stored in UTC sqlite format.
	dueTime, err := time.Parse(sqliteTimeFormat, ri.Due)
	if err != nil {
		return nil, fmt.Errorf("parse due time %q: %w", ri.Due, err)
	}

	// P0 fix: FSRS dereferences Card.Step without nil check, so we must always
	// supply a valid pointer. Default to 0 for fresh items.
	step := 0
	if ri.Step != nil {
		step = *ri.Step
	}

	card := &fsrs.Card{
		CardID:     int(ri.ID),
		State:      fsrs.State(ri.State),
		Stability:  ri.Stability,
		Difficulty: ri.Difficulty,
		Step:       &step,
		Due:        dueTime,
	}

	if ri.LastReviewAt != nil {
		lr, err := time.Parse(sqliteTimeFormat, *ri.LastReviewAt)
		if err != nil {
			return nil, fmt.Errorf("parse last_review_at %q: %w", *ri.LastReviewAt, err)
		}
		card.LastReview = &lr
	}

	// Track previous state to detect lapses (Review -> Relearning).
	prevState := ri.State

	newCard, _ := s.scheduler.ReviewCard(card, fsrs.Rating(rating), nil, nil)

	ri.Stability = newCard.Stability
	ri.Difficulty = newCard.Difficulty
	// Graduated cards (Review state) can come back with a nil Step from FSRS,
	// but review_items.step is NOT NULL. Persist the last known step (0 for fresh
	// items) instead of writing NULL.
	if newCard.Step != nil {
		ri.Step = newCard.Step
	} else {
		ri.Step = &step
	}
	ri.Due = newCard.Due.UTC().Format(sqliteTimeFormat)
	ri.State = int(newCard.State)
	ri.Reps++

	// Increment lapses when a Review-state card transitions to Relearning.
	if prevState == int(fsrs.StateReview) && ri.State == int(fsrs.StateRelearning) {
		ri.Lapses++
	}

	now := time.Now().UTC().Format(sqliteTimeFormat)
	ri.LastReviewAt = &now

	if err := s.repo.Update(ctx, ri); err != nil {
		return nil, err
	}

	return &GradeResponse{
		Due:        ri.Due,
		State:      ri.State,
		Stability:  ri.Stability,
		Difficulty: ri.Difficulty,
	}, nil
}

// EnsureReviewItem creates a review item if it does not already exist.
func (s *Service) EnsureReviewItem(ctx context.Context, userID int, itemType string, itemID int) error {
	exists, err := s.repo.Exists(ctx, userID, itemType, itemID)
	if err != nil {
		return err
	}
	if !exists {
		return s.repo.Create(ctx, userID, itemType, itemID)
	}
	return nil
}

// Exists checks whether a review item exists for the given user/type/item.
func (s *Service) Exists(ctx context.Context, userID int, itemType string, itemID int) (bool, error) {
	return s.repo.Exists(ctx, userID, itemType, itemID)
}

// EnsureUserReviewItems creates review_items for every knowledge_card for the given user.
// Idempotent: uses INSERT OR IGNORE so repeated calls are safe.
func (s *Service) EnsureUserReviewItems(ctx context.Context, userID int) (int64, error) {
	return s.repo.EnsureUserReviewItems(ctx, userID)
}
