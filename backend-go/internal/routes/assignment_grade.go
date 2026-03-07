package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func GradeAssignmentSubmission(c *gin.Context) {
	submissionID := c.Param("submissionId")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	var body models.GradeAssignmentSubmissionRequest

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	service := services.NewAssignmentService()
	if err := service.GradeSubmission(submissionID, userID, userRole, body.Marks, body.Feedback); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Submission graded successfully",
	})
}
