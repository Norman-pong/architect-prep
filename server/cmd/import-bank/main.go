package main

import (
	"context"
	"flag"
	"fmt"
	"log"

	"github.com/normanway/architect-prep/internal/db"
	"github.com/normanway/architect-prep/internal/seed"
)

func main() {
	bankPath := flag.String("bank", "data/bank.json", "Path to bank.json")
	dbPath := flag.String("db", "", "SQLite database path (required)")
	flag.Parse()

	if *dbPath == "" {
		log.Fatal("--db is required")
	}

	database, err := db.NewDB(*dbPath)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer database.Close()

	imported, err := seed.ImportBank(context.Background(), database, *bankPath)
	if err != nil {
		log.Fatalf("import failed: %v", err)
	}

	var total int
	database.QueryRow("SELECT COUNT(*) FROM questions").Scan(&total)
	fmt.Printf("Imported %d questions. Total in DB: %d\n", imported, total)
}
