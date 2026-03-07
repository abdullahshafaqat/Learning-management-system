package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func GetTeacherAnalytics(c *gin.Context) {
	userID := c.GetString("userId")

	progressService := services.NewProgressService()
	analytics, err := progressService.GetTeacherAnalytics(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    analytics,
	})
}
