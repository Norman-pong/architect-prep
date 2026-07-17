package main

import (
	"context"
	"flag"
	"log"
	"os"

	"github.com/normanway/architect-prep/internal/db"
	"github.com/normanway/architect-prep/internal/seed"
)

func main() {
	dbPath := flag.String("db", "data/architect.db", "SQLite database path")
	bankPath := flag.String("bank", "data/bank.json", "bank.json path (single source of truth for questions)")
	flag.Parse()

	database, err := db.NewDB(*dbPath)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	defer database.Close()

	if err := seed.Run(database); err != nil {
		log.Fatalf("seed.Run failed: %v", err)
	}

	if _, err := os.Stat(*bankPath); err != nil {
		if os.IsNotExist(err) {
			log.Printf("seed: bank.json not found at %s, skipping question import", *bankPath)
		} else {
			log.Fatalf("seed: stat bank.json failed: %v", err)
		}
	} else {
		imported, err := seed.ImportBank(context.Background(), database, *bankPath)
		if err != nil {
			log.Fatalf("seed.ImportBank failed: %v", err)
		}
		log.Printf("seed complete: %d questions imported from %s", imported, *bankPath)
	}
}
