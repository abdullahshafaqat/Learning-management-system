package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func GetStudentEnrollments(c *gin.Context) {
	enrollmentService := services.NewEnrollmentService()

	studentID := c.GetString("userId")

	result, err := enrollmentService.GetStudentEnrollments(studentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"enrollments": result,
	})
}
