package middlewares

import (
	"context"
	"net/http"
	"strings"
	"time"

	authRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/auth"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try to get token from cookie
		token, err := c.Cookie("token")
		if err != nil {
			// If not in cookie, check Authorization header
			authHeader := c.GetHeader("Authorization")
			if authHeader != "" {
				token = strings.Replace(authHeader, "Bearer ", "", 1)
			}
		}

		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Access denied. No token provided."})
			c.Abort()
			return
		}

		claims, err := utils.VerifyToken(token)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid token."})
			c.Abort()
			return
		}

		// Check if user is blocked
		userObjID, err := primitive.ObjectIDFromHex(claims.ID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token."})
			c.Abort()
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		repo := authRepo.NewAuthRepository()
		user, err := repo.FindUserByID(ctx, userObjID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found."})
			c.Abort()
			return
		}

		if user.IsBlocked {
			c.JSON(http.StatusForbidden, gin.H{"error": "Your account has been blocked."})
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("userId", claims.ID)
		c.Set("userRole", claims.Role)
		c.Next()
	}
}
