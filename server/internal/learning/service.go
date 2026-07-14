package learning

import "context"

// Service provides business logic for the learning domain.
type Service struct {
	repo *Repository
}

// NewService creates a learning service backed by repo.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// RecordView delegates to the repository to record a view event.
func (s *Service) RecordView(ctx context.Context, userID, pointID int) error {
	return s.repo.RecordView(ctx, userID, pointID)
}

// ToggleMastered delegates to the repository to toggle mastered state.
func (s *Service) ToggleMastered(ctx context.Context, userID, pointID int, mastered bool) error {
	return s.repo.ToggleMastered(ctx, userID, pointID, mastered)
}

// GetProgress delegates to the repository to fetch user progress.
func (s *Service) GetProgress(ctx context.Context, userID int) (*ProgressResponse, error) {
	return s.repo.GetProgress(ctx, userID)
}

// GetPointStatus delegates to the repository to fetch point status.
func (s *Service) GetPointStatus(ctx context.Context, userID, pointID int) (*PointStatus, error) {
	return s.repo.GetPointStatus(ctx, userID, pointID)
}
