package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/utils"
	"github.com/gin-gonic/gin"
)

func Signup(c *gin.Context) {
	authService := services.NewAuthService()

	var body models.SignupRequest

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	accessToken, refreshToken, user, err := authService.Register(body.Username, body.Email, body.Password, body.Role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	utils.SetTokenCookie(c, accessToken, refreshToken)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "User registered successfully",
		"user":    user,
	})
}
