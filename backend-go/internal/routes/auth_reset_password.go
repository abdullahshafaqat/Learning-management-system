package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func ResetPassword(c *gin.Context) {
	authService := services.NewAuthService()

	var body models.ResetPasswordRequest

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	if body.NewPassword != body.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Passwords do not match"})
		return
	}

	err := authService.ResetPassword(body.Token, body.NewPassword)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Password has been reset. Please sign in with your new password.",
	})
}
