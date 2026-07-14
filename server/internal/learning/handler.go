package learning

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/normanway/architect-prep/internal/middleware"
)

// Handler exposes HTTP endpoints for the learning domain.
type Handler struct {
	repo    *Repository
	service *Service
}

// NewHandler creates a learning HTTP handler.
func NewHandler(repo *Repository, service *Service) *Handler {
	return &Handler{repo: repo, service: service}
}

// RegisterRoutes mounts learning routes on the provided router group.
// The caller should supply a group that already includes the /api/v1 prefix.
func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	r.POST("/points/:point_id/view", h.RecordView)
	r.POST("/points/:point_id/master", h.ToggleMastered)
	r.GET("/progress", h.GetProgress)
	r.GET("/points/:point_id", h.GetPointStatus)
}

// getUserID extracts the authenticated user id from the Gin context.
func getUserID(c *gin.Context) (int, error) {
	return strconv.Atoi(c.GetString(middleware.ContextUserID))
}

// RecordView handles POST /points/:point_id/view.
func (h *Handler) RecordView(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil || userID <= 0 {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}

	pointID, err := strconv.Atoi(c.Param("point_id"))
	if err != nil || pointID <= 0 {
		middleware.Error(c, http.StatusBadRequest, "invalid point id")
		return
	}

	if err := h.service.RecordView(c.Request.Context(), userID, pointID); err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, gin.H{"viewed": true})
}

// ToggleMastered handles POST /points/:point_id/master.
func (h *Handler) ToggleMastered(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil || userID <= 0 {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}

	pointID, err := strconv.Atoi(c.Param("point_id"))
	if err != nil || pointID <= 0 {
		middleware.Error(c, http.StatusBadRequest, "invalid point id")
		return
	}

	var req MasterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.Error(c, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.service.ToggleMastered(c.Request.Context(), userID, pointID, req.Mastered); err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, gin.H{"mastered": req.Mastered})
}

// GetProgress handles GET /progress.
func (h *Handler) GetProgress(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil || userID <= 0 {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}

	resp, err := h.service.GetProgress(c.Request.Context(), userID)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, resp)
}

// GetPointStatus handles GET /points/:point_id.
func (h *Handler) GetPointStatus(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil || userID <= 0 {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}

	pointID, err := strconv.Atoi(c.Param("point_id"))
	if err != nil || pointID <= 0 {
		middleware.Error(c, http.StatusBadRequest, "invalid point id")
		return
	}

	resp, err := h.service.GetPointStatus(c.Request.Context(), userID, pointID)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, resp)
}
