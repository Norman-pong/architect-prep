package router

import (
	"log"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/normanway/architect-prep/internal/auth"
	"github.com/normanway/architect-prep/internal/config"
	"github.com/normanway/architect-prep/internal/db"
	"github.com/normanway/architect-prep/internal/knowledge"
	"github.com/normanway/architect-prep/internal/middleware"
	"github.com/normanway/architect-prep/internal/practice"
	"github.com/normanway/architect-prep/internal/user"
)

// Register initializes all HTTP routes and returns the configured Gin engine.
func Register(cfg *config.Config) *gin.Engine {
	// Database
	database, err := db.NewDB(cfg.DBPath)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware())

	r.GET("/health", func(c *gin.Context) {
		middleware.Success(c, gin.H{"status": "ok"})
	})

	v1 := r.Group("/api/v1")

	// Auth routes (no JWT required for send-code/verify-login, JWT for /me)
	authGroup := v1.Group("/auth")
	{
		codeStore := auth.NewCodeStore()
		codeStore.StartCleanup(60 * time.Second)

		smtpPort, err := strconv.Atoi(cfg.SMTPPort)
		if err != nil {
			smtpPort = 587
		}
		smtpSender := auth.NewSMTPSender(cfg.SMTPHost, smtpPort, cfg.SMTPUser, cfg.SMTPPass, cfg.SMTPFrom)

		userRepo := user.NewStore(database)
		authService := auth.NewAuthService(codeStore, smtpSender, cfg.JWTSecret, userRepo)
		authHandler := auth.NewHandler(authService)
		authHandler.RegisterRoutes(authGroup)
	}

	// Knowledge routes (JWT required)
	knowledgeRepo := knowledge.NewRepository(database)
	knowledgeHandler := knowledge.NewHandler(knowledgeRepo)
	knowledgeGroup := v1.Group("/knowledge")
	knowledgeGroup.Use(middleware.JWTAuth())
	{
		knowledgeHandler.RegisterRoutes(knowledgeGroup)
	}

	// Practice routes (JWT required)
	practiceRepo := practice.NewRepository(database)
	practiceService := practice.NewService(practiceRepo)
	practiceHandler := practice.NewHandler(practiceRepo, practiceService)
	practiceGroup := v1.Group("/practice")
	practiceGroup.Use(middleware.JWTAuth())
	{
		practiceHandler.RegisterRoutes(practiceGroup)
	}

	return r
}
