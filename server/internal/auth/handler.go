package auth

import (
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/normanway/architect-prep/internal/middleware"
)

// Handler 认证 HTTP 处理器
type Handler struct {
	service *AuthService
}

// NewHandler 创建认证处理器
func NewHandler(service *AuthService) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes 注册认证路由
func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/send-code", h.SendCode)
	rg.POST("/verify-login", h.VerifyLogin)
	rg.GET("/me", middleware.JWTAuth(), h.Me)
}

// SendCode 发送验证码
func (h *Handler) SendCode(c *gin.Context) {
	var req SendCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.service.SendCode(c.Request.Context(), req.Email); err != nil {
		log.Printf("send verification code failed: %v", err)
		middleware.Error(c, http.StatusInternalServerError, fmt.Sprintf("failed to send verification code: %v", err))
		return
	}

	middleware.Success(c, gin.H{"sent": true})
}

// VerifyLogin 验证码登录
func (h *Handler) VerifyLogin(c *gin.Context) {
	var req VerifyLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	resp, err := h.service.VerifyLogin(c.Request.Context(), req.Email, req.Code)
	if err != nil {
		if err == ErrCodeNotFound || err == ErrCodeMismatch {
			middleware.Error(c, http.StatusUnauthorized, err.Error())
			return
		}
		middleware.Error(c, http.StatusInternalServerError, "verification failed")
		return
	}

	middleware.Success(c, resp)
}

// Me 获取当前登录用户信息
func (h *Handler) Me(c *gin.Context) {
	userIDVal, exists := c.Get(middleware.ContextUserID)
	if !exists {
		middleware.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	// JWT stores userID as string, parse to int
	userIDStr, ok := userIDVal.(string)
	if !ok {
		middleware.Error(c, http.StatusUnauthorized, "invalid token")
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		middleware.Error(c, http.StatusUnauthorized, "invalid user id")
		return
	}

	user, err := h.service.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		middleware.Error(c, http.StatusNotFound, "user not found")
		return
	}

	middleware.Success(c, user)
}
