package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func GetStudentAssignments(c *gin.Context) {
	studentID := c.GetString("userId")
	service := services.NewAssignmentService()

	items, err := service.GetStudentAssignments(studentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    items,
	})
}
