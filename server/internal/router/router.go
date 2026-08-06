package router

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/normanway/architect-prep/internal/auth"
	"github.com/normanway/architect-prep/internal/config"
	"github.com/normanway/architect-prep/internal/db"
	"github.com/normanway/architect-prep/internal/knowledge"
	"github.com/normanway/architect-prep/internal/learning"
	"github.com/normanway/architect-prep/internal/middleware"
	"github.com/normanway/architect-prep/internal/practice"
	"github.com/normanway/architect-prep/internal/review"
	"github.com/normanway/architect-prep/internal/seed"
	"github.com/normanway/architect-prep/internal/user"
)

// Register initializes all HTTP routes and returns the configured Gin engine.
func Register(cfg *config.Config) *gin.Engine {
	// Database
	database, err := db.NewDB(cfg.DBPath)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// Auto-seed if database is empty (first run)
	bankPath := os.Getenv("BANK_PATH")
	if bankPath == "" {
		bankPath = "data/bank.json"
	}
	seed.AutoSeedIfEmpty(database, bankPath)

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware())

	r.GET("/health", func(c *gin.Context) {
		middleware.Success(c, gin.H{"status": "ok"})
	})

	v1 := r.Group("/api/v1")

	// Review service must be built before auth because auth depends on it
	// to ensure review_items for new users.
	reviewRepo := review.NewRepository(database)
	reviewService := review.NewService(reviewRepo)

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
		authService := auth.NewAuthService(codeStore, smtpSender, cfg.JWTSecret, userRepo, reviewService)
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

	// Review routes (JWT required) — must init before practice because practice depends on review
	reviewHandler := review.NewHandler(reviewRepo, reviewService)
	reviewGroup := v1.Group("/review")
	reviewGroup.Use(middleware.JWTAuth())
	{
		reviewHandler.RegisterRoutes(reviewGroup)
	}

	// Practice routes (JWT required)
	practiceRepo := practice.NewRepository(database)
	practiceService := practice.NewService(practiceRepo, reviewService)
	practiceHandler := practice.NewHandler(practiceRepo, practiceService)
	practiceGroup := v1.Group("/practice")
	practiceGroup.Use(middleware.JWTAuth())
	{
		practiceHandler.RegisterRoutes(practiceGroup)
	}

	// Learning routes (JWT required)
	learningRepo := learning.NewRepository(database)
	learningService := learning.NewService(learningRepo)
	learningHandler := learning.NewHandler(learningRepo, learningService)
	learningGroup := v1.Group("/learning")
	learningGroup.Use(middleware.JWTAuth())
	{
		learningHandler.RegisterRoutes(learningGroup)
	}

	// Serve frontend static files (SPA mode)
	distPath := "./web/dist"
	if _, err := os.Stat(distPath); err == nil {
		r.Static("/assets", distPath+"/assets")
		r.StaticFile("/favicon.ico", distPath+"/favicon.ico")
		r.StaticFile("/vite.svg", distPath+"/vite.svg")
		r.GET("/", func(c *gin.Context) {
			c.File(distPath + "/index.html")
		})
		r.NoRoute(func(c *gin.Context) {
			if strings.HasPrefix(c.Request.URL.Path, "/api/") {
				middleware.Error(c, http.StatusNotFound, "not found")
				return
			}
			c.File(distPath + "/index.html")
		})
	}

	return r
}
