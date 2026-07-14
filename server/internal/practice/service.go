package practice

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/normanway/architect-prep/internal/review"
)

// Service provides business logic for the practice domain.
type Service struct {
	repo          *Repository
	reviewService *review.Service
}

// NewService creates a practice service backed by repo.
func NewService(repo *Repository, reviewService *review.Service) *Service {
	return &Service{repo: repo, reviewService: reviewService}
}

// Submit grades a user's answer and records the result.
func (s *Service) Submit(ctx context.Context, userID, questionID int, userAnswerKeys []string) (*SubmitResponse, error) {
	q, err := s.repo.GetQuestion(ctx, questionID)
	if err != nil {
		return nil, err
	}
	if q == nil {
		return nil, fmt.Errorf("question not found")
	}

	var correctAnswerKeys []string
	if len(q.AnswerKeys) > 0 {
		if err := json.Unmarshal(q.AnswerKeys, &correctAnswerKeys); err != nil {
			return nil, fmt.Errorf("unmarshal answer keys: %w", err)
		}
	}

	isCorrect := grade(userAnswerKeys, correctAnswerKeys)

	userAnswerJSON, err := json.Marshal(userAnswerKeys)
	if err != nil {
		return nil, fmt.Errorf("marshal user answer: %w", err)
	}

	isCorrectInt := 0
	if isCorrect {
		isCorrectInt = 1
	}

	if err := s.repo.InsertPracticeRecord(ctx, userID, questionID, string(userAnswerJSON), isCorrectInt); err != nil {
		return nil, err
	}

	if !isCorrect {
		if err := s.repo.InsertWrongQuestion(ctx, userID, questionID); err != nil {
			return nil, err
		}
		if s.reviewService != nil {
			if err := s.reviewService.EnsureReviewItem(ctx, userID, "wrong_question", questionID); err != nil {
				log.Printf("warning: ensure review item failed: %v", err)
			}
		}
	} else {
		// Do NOT delete from wrong_questions; instead grade the review item as Good.
		// _ = s.repo.DeleteWrongQuestion(ctx, userID, questionID)
		if s.reviewService != nil {
			exists, err := s.reviewService.Exists(ctx, userID, "wrong_question", questionID)
			if err != nil {
				log.Printf("warning: check review item exists failed: %v", err)
			} else if exists {
				if _, err := s.reviewService.GradeCard(ctx, userID, "wrong_question", questionID, 3); err != nil {
					log.Printf("warning: grade review item failed: %v", err)
				}
			}
		}
	}

	explanation := ""
	if q.Explanation != nil {
		explanation = *q.Explanation
	}

	return &SubmitResponse{
		IsCorrect:         isCorrect,
		CorrectAnswerKeys: correctAnswerKeys,
		Explanation:       explanation,
	}, nil
}

// grade compares two string slices as sets.
func grade(userKeys, correctKeys []string) bool {
	if len(userKeys) != len(correctKeys) {
		return false
	}
	correctSet := make(map[string]struct{}, len(correctKeys))
	for _, k := range correctKeys {
		correctSet[k] = struct{}{}
	}
	for _, k := range userKeys {
		if _, ok := correctSet[k]; !ok {
			return false
		}
	}
	return true
}
