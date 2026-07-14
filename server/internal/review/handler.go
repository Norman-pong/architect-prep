package review

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/normanway/architect-prep/internal/middleware"
)

// Handler exposes HTTP endpoints for the review domain.
type Handler struct {
	repo    *Repository
	service *Service
}

// NewHandler creates a review HTTP handler.
func NewHandler(repo *Repository, service *Service) *Handler {
	return &Handler{repo: repo, service: service}
}

// RegisterRoutes mounts review routes on the provided router group.
func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/due", h.GetDue)
	r.POST("/grade", h.Grade)
	r.GET("/stats", h.GetStats)
	r.POST("/migrate", h.Migrate)
}

// getUserID extracts the authenticated user id from the Gin context.
func getUserID(c *gin.Context) (int, error) {
	return strconv.Atoi(c.GetString(middleware.ContextUserID))
}

// parsePageParams parses pagination query params with sensible defaults.
func parsePageParams(c *gin.Context) (page, pageSize int) {
	page, _ = strconv.Atoi(c.Query("page"))
	pageSize, _ = strconv.Atoi(c.Query("page_size"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	return page, pageSize
}

// GetDue returns paginated due review items.
func (h *Handler) GetDue(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil || userID <= 0 {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}

	itemType := c.Query("item_type")
	page, pageSize := parsePageParams(c)

	resp, err := h.repo.GetDue(c.Request.Context(), userID, itemType, page, pageSize)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, resp)
}

// Grade grades a review item using FSRS.
func (h *Handler) Grade(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil || userID <= 0 {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}

	var req GradeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.Error(c, http.StatusBadRequest, "invalid request body")
		return
	}

	resp, err := h.service.GradeCard(c.Request.Context(), userID, req.ItemType, req.ItemID, req.Rating)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, resp)
}

// GetStats returns review statistics for the current user.
func (h *Handler) GetStats(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil || userID <= 0 {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}

	stats, err := h.repo.GetStats(c.Request.Context(), userID)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, stats)
}

// Migrate migrates existing wrong_questions into review_items.
func (h *Handler) Migrate(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil || userID <= 0 {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}

	count, err := h.repo.MigrateWrongQuestions(c.Request.Context(), userID)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, gin.H{"migrated": count})
}
