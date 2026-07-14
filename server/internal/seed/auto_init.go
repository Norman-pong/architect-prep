package seed

import (
	"context"
	"database/sql"
	"log"
	"os"
)

// AutoSeedIfEmpty checks if the database has chapters. If empty, runs Run + ImportBank.
// If bankPath does not exist, bank import is skipped (non-fatal).
// This is called at server startup to self-initialize a fresh database.
func AutoSeedIfEmpty(database *sql.DB, bankPath string) {
	ctx := context.Background()

	var count int
	if err := database.QueryRowContext(ctx, "SELECT COUNT(*) FROM chapters").Scan(&count); err != nil {
		log.Printf("auto-seed: check chapters failed: %v", err)
		return
	}

	if count > 0 {
		log.Printf("auto-seed: database already has %d chapters, skipping", count)
		return
	}

	log.Println("auto-seed: empty database detected, initializing...")

	if err := Run(database); err != nil {
		log.Printf("auto-seed: seed failed: %v", err)
		return
	}

	if bankPath == "" {
		return
	}

	if _, err := os.Stat(bankPath); err != nil {
		log.Printf("auto-seed: bank.json not found at %s, skipping question import", bankPath)
		return
	}

	imported, err := ImportBank(ctx, database, bankPath)
	if err != nil {
		log.Printf("auto-seed: bank import failed: %v", err)
		return
	}

	log.Printf("auto-seed: imported %d questions from bank.json", imported)
}
