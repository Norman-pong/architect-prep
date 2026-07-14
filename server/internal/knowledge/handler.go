package knowledge

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/normanway/architect-prep/internal/middleware"
)

// Handler exposes HTTP endpoints for the knowledge domain.
type Handler struct {
	repo *Repository
}

// NewHandler creates a knowledge HTTP handler.
func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

// RegisterRoutes mounts knowledge routes on the provided router group.
// The caller should supply a group that already includes the /api/v1 prefix.
func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/chapters", h.ListChapters)
	r.GET("/chapters/:id", h.GetChapter)
	r.GET("/chapters/:id/points", h.ListKnowledgePoints)
	r.GET("/search", h.SearchKnowledgePoints)
}

// ListChapters responds with all chapters.
func (h *Handler) ListChapters(c *gin.Context) {
	chapters, err := h.repo.ListChapters(c.Request.Context())
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, chapters)
}

// GetChapter responds with a single chapter by id.
func (h *Handler) GetChapter(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		middleware.Error(c, http.StatusBadRequest, "invalid chapter id")
		return
	}

	chapter, err := h.repo.GetChapter(c.Request.Context(), id)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	if chapter == nil {
		middleware.Error(c, http.StatusNotFound, "chapter not found")
		return
	}
	middleware.Success(c, chapter)
}

// ListKnowledgePoints responds with all knowledge points for a chapter.
func (h *Handler) ListKnowledgePoints(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		middleware.Error(c, http.StatusBadRequest, "invalid chapter id")
		return
	}

	points, err := h.repo.ListKnowledgePoints(c.Request.Context(), id)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, points)
}

// SearchKnowledgePoints searches knowledge points by title or content.
func (h *Handler) SearchKnowledgePoints(c *gin.Context) {
	q := c.Query("q")
	if q == "" {
		middleware.Error(c, http.StatusBadRequest, "missing query parameter q")
		return
	}

	points, err := h.repo.SearchKnowledgePoints(c.Request.Context(), q)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, points)
}
