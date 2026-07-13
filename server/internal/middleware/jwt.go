package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/normanway/architect-prep/internal/config"
)

const (
	// ContextUserID is the key used to store the authenticated user ID in context.
	ContextUserID = "userID"

	// AuthorizationHeader is the expected HTTP header for tokens.
	AuthorizationHeader = "Authorization"

	// BearerPrefix is the required prefix for Authorization tokens.
	BearerPrefix = "Bearer "
)

// UserClaims extends the registered JWT claims with a custom userID field.
type UserClaims struct {
	UserID string `json:"userID"`
	jwt.RegisteredClaims
}

// JWTAuth returns a middleware that validates Bearer JWT tokens and injects userID into context.
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader(AuthorizationHeader)
		if authHeader == "" {
			Error(c, http.StatusUnauthorized, "missing authorization header")
			c.Abort()
			return
		}

		if !strings.HasPrefix(authHeader, BearerPrefix) {
			Error(c, http.StatusUnauthorized, "invalid authorization header format")
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, BearerPrefix)
		claims := &UserClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(config.C.JWTSecret), nil
		})
		if err != nil || !token.Valid {
			Error(c, http.StatusUnauthorized, "invalid or expired token")
			c.Abort()
			return
		}

		if claims.UserID == "" {
			Error(c, http.StatusUnauthorized, "invalid token subject")
			c.Abort()
			return
		}

		c.Set(ContextUserID, claims.UserID)
		c.Next()
	}
}
