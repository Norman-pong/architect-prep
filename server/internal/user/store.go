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

// scanUser scans a row into a User, handling nullable nickname.
func scanUser(row interface {
	Scan(dest ...any) error
}) (*auth.User, error) {
	var u auth.User
	var nickname sql.NullString
	if err := row.Scan(&u.ID, &u.Email, &nickname); err != nil {
		return nil, err
	}
	if nickname.Valid {
		u.Nickname = nickname.String
	}
	return &u, nil
}

// GetOrCreateUserByEmail returns an existing user by email or creates one
// with the given email when it does not exist.
func (s *Store) GetOrCreateUserByEmail(ctx context.Context, email string) (*auth.User, error) {
	query := `
		INSERT INTO users (email) VALUES (?)
		ON CONFLICT(email) DO UPDATE SET email = excluded.email
		RETURNING id, email, nickname
	`
	return scanUser(s.db.QueryRowContext(ctx, query, email))
}

// GetUserByID returns a user by their integer ID.
func (s *Store) GetUserByID(ctx context.Context, id int) (*auth.User, error) {
	query := `SELECT id, email, nickname FROM users WHERE id = ?`
	u, err := scanUser(s.db.QueryRowContext(ctx, query, id))
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return u, nil
}
