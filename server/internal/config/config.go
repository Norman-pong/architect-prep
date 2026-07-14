package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all environment-based configuration for the application.
type Config struct {
	ServerPort string
	DBPath     string
	JWTSecret  string

	SMTPHost string
	SMTPPort string
	SMTPUser string
	SMTPPass string
	SMTPFrom string
}

// C is the package-level configuration set during Load.
var C *Config

// Load reads configuration from environment variables, optionally loading a .env file first.
func Load(envFile string) *Config {
	if envFile == "" {
		envFile = os.Getenv("ENV_FILE")
		if envFile == "" {
			envFile = ".env"
		}
	}

	if _, err := os.Stat(envFile); err == nil {
		if err := godotenv.Load(envFile); err != nil {
			log.Printf("failed to load %s: %v", envFile, err)
		}
	}

	cfg := &Config{
		ServerPort: getEnv("SERVER_PORT", "8080"),
		DBPath:     getEnv("DB_PATH", "data/architect.db"),
		JWTSecret:  getEnv("JWT_SECRET", ""),
		SMTPHost:   getEnv("SMTP_HOST", ""),
		SMTPPort:   getEnv("SMTP_PORT", ""),
		SMTPUser:   getEnv("SMTP_USER", ""),
		SMTPPass:   getEnv("SMTP_PASS", ""),
		SMTPFrom:   getEnv("SMTP_FROM", ""),
	}

	// Validate JWT secret: refuse to start with weak/empty secret
	if len(cfg.JWTSecret) < 16 {
		log.Fatal("JWT_SECRET must be set and at least 16 characters long")
	}
	C = cfg
	return cfg
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
