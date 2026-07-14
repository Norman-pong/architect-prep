package main

import (
	"flag"
	"log"

	"github.com/normanway/architect-prep/internal/db"
	"github.com/normanway/architect-prep/internal/seed"
)

func main() {
	dbPath := flag.String("db", "data/architect.db", "SQLite database path")
	flag.Parse()

	database, err := db.NewDB(*dbPath)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	defer database.Close()

	if err := seed.Run(database); err != nil {
		log.Fatalf("seed failed: %v", err)
	}
}
