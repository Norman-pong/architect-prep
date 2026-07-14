package practice

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/normanway/architect-prep/internal/middleware"
)

// Handler exposes HTTP endpoints for the practice domain.
type Handler struct {
	repo    *Repository
	service *Service
}

// NewHandler creates a practice HTTP handler.
func NewHandler(repo *Repository, service *Service) *Handler {
	return &Handler{repo: repo, service: service}
}

// RegisterRoutes mounts practice routes on the provided router group.
// The caller should supply a group that already includes the /api/v1 prefix.
func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/questions", h.ListQuestions)
	r.GET("/questions/:id", h.GetQuestion)
	r.POST("/submit", h.Submit)
	r.GET("/wrong-questions", h.ListWrongQuestions)
	r.GET("/favorites", h.ListFavorites)
	r.GET("/stats", h.GetStats)
	r.POST("/favorites/:question_id", h.AddFavorite)
	r.DELETE("/favorites/:question_id", h.RemoveFavorite)
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

// ListQuestions returns a paginated list of questions.
func (h *Handler) ListQuestions(c *gin.Context) {
	var req QuestionListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		middleware.Error(c, http.StatusBadRequest, "invalid query parameters")
		return
	}
	page, pageSize := parsePageParams(c)

	resp, err := h.repo.ListQuestions(c.Request.Context(), req.ChapterID, req.ExamType, page, pageSize)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, resp)
}

// GetQuestion returns a single question by id.
func (h *Handler) GetQuestion(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		middleware.Error(c, http.StatusBadRequest, "invalid question id")
		return
	}

	q, err := h.repo.GetQuestion(c.Request.Context(), id)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	if q == nil {
		middleware.Error(c, http.StatusNotFound, "question not found")
		return
	}
	middleware.Success(c, q)
}

// Submit grades a user's answer submission.
func (h *Handler) Submit(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil || userID <= 0 {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}

	var req SubmitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.Error(c, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.QuestionID <= 0 {
		middleware.Error(c, http.StatusBadRequest, "invalid question id")
		return
	}

	resp, err := h.service.Submit(c.Request.Context(), userID, req.QuestionID, req.AnswerKeys)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, resp)
}

// ListWrongQuestions returns the current user's wrong questions.
func (h *Handler) ListWrongQuestions(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil || userID <= 0 {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}
	page, pageSize := parsePageParams(c)

	resp, err := h.repo.ListWrongQuestions(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, resp)
}
// ListFavorites returns the current user's favorited questions.
func (h *Handler) ListFavorites(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil || userID <= 0 {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}
	page, pageSize := parsePageParams(c)

	resp, err := h.repo.ListFavorites(c.Request.Context(), userID, page, pageSize)
	if err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, resp)
}

// GetStats returns the current user's practice statistics.
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

// AddFavorite adds a question to the user's favorites.
func (h *Handler) AddFavorite(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil || userID <= 0 {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}

	questionID, err := strconv.Atoi(c.Param("question_id"))
	if err != nil || questionID <= 0 {
		middleware.Error(c, http.StatusBadRequest, "invalid question id")
		return
	}

	if err := h.repo.AddFavorite(c.Request.Context(), userID, questionID); err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, nil)
}

// RemoveFavorite removes a question from the user's favorites.
func (h *Handler) RemoveFavorite(c *gin.Context) {
	userID, err := getUserID(c)
	if err != nil || userID <= 0 {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}

	questionID, err := strconv.Atoi(c.Param("question_id"))
	if err != nil || questionID <= 0 {
		middleware.Error(c, http.StatusBadRequest, "invalid question id")
		return
	}

	if err := h.repo.RemoveFavorite(c.Request.Context(), userID, questionID); err != nil {
		middleware.Error(c, http.StatusInternalServerError, err.Error())
		return
	}
	middleware.Success(c, nil)
}
