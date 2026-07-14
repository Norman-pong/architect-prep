package main

import (
	"flag"
	"log"

	"github.com/normanway/architect-prep/internal/seed"
)

func main() {
	dbPath := flag.String("db", "data/architect.db", "SQLite database path")
	flag.Parse()

	if err := seed.Run(*dbPath); err != nil {
		log.Fatalf("seed failed: %v", err)
	}
}
