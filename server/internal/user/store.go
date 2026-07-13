package user

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/normanway/architect-prep/internal/auth"
)

// Store provides user persistence operations.
type Store struct {
	db *sql.DB
}

// NewStore creates a user store backed by db.
func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

// GetOrCreateUserByEmail returns an existing user by email or creates one
// with the given email when it does not exist.
func (s *Store) GetOrCreateUserByEmail(ctx context.Context, email string) (*auth.User, error) {
	query := `
		INSERT INTO users (email) VALUES (?)
		ON CONFLICT(email) DO UPDATE SET email = excluded.email
		RETURNING id, email, nickname
	`

	var u auth.User
	if err := s.db.QueryRowContext(ctx, query, email).Scan(&u.ID, &u.Email, &u.Nickname); err != nil {
		return nil, fmt.Errorf("get or create user by email: %w", err)
	}
	return &u, nil
}
