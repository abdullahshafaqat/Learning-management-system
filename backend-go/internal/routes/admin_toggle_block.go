package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func ToggleUserBlock(c *gin.Context) {
	adminService := services.NewAdminService()

	userID := c.Param("id")
	var body models.ToggleUserBlockRequest

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	user, err := adminService.ToggleUserBlock(userID, body.IsBlocked)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	statusMsg := "unblocked"
	if body.IsBlocked {
		statusMsg = "blocked"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User " + statusMsg + " successfully",
		"user":    user,
	})
}
