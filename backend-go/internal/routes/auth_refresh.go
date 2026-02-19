package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/utils"
	"github.com/gin-gonic/gin"
)

func RefreshToken(c *gin.Context) {
	refreshToken, err := c.Cookie("refreshToken")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "Refresh token required"})
		return
	}

	authService := services.NewAuthService()
	newAccessToken, newRefreshToken, err := authService.RotateTokens(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": err.Error()})
		return
	}

	utils.SetTokenCookie(c, newAccessToken, newRefreshToken)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Token refreshed",
	})
}
