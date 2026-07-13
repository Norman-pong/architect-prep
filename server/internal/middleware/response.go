package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// JSONResponse is the unified API response format.
type JSONResponse struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

// Success sends a successful JSON response.
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, JSONResponse{
		Code:    0,
		Message: "success",
		Data:    data,
	})
}

// Error sends a JSON error response with the given status code and message.
func Error(c *gin.Context, code int, msg string) {
	c.JSON(code, JSONResponse{
		Code:    code,
		Message: msg,
		Data:    nil,
	})
}
