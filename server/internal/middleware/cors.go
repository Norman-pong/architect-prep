package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware configures cross-origin request handling for the frontend.
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		allowedOrigins := map[string]struct{}{
			"http://localhost:5173":  {},
			"http://localhost:3000":  {},
			"http://localhost:3001":  {},
			"http://127.0.0.1:5173": {},
			"http://127.0.0.1:3000": {},
			"http://127.0.0.1:3001": {},
		}

		if _, ok := allowedOrigins[origin]; ok {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
