package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func GetAssignment(c *gin.Context) {
	assignmentID := c.Param("id")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	service := services.NewAssignmentService()
	assignment, mySubmission, err := service.GetAssignment(assignmentID, userID, userRole)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"assignment":   assignment,
		"mySubmission": mySubmission,
	})
}
