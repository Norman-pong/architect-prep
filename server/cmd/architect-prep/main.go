package main

import (
	"log"

	"github.com/normanway/architect-prep/internal/config"
	"github.com/normanway/architect-prep/internal/router"
)

func main() {
	cfg := config.Load("")

	r := router.Register(cfg)

	addr := ":" + cfg.ServerPort
	log.Printf("server listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
