package routes

import (
	"net/http"
	"strings"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func EnrollStudent(c *gin.Context) {
	enrollmentService := services.NewEnrollmentService()

	courseID := c.Param("courseId")
	studentID := c.GetString("userId")

	enrollment, err := enrollmentService.EnrollStudent(courseID, studentID)
	if err != nil {
		status := http.StatusBadRequest
		if strings.Contains(strings.ToLower(err.Error()), "not found") {
			status = http.StatusNotFound
		} else if strings.Contains(strings.ToLower(err.Error()), "access denied") {
			status = http.StatusForbidden
		} else if !strings.Contains(strings.ToLower(err.Error()), "already enrolled") {
			status = http.StatusInternalServerError
		}
		c.JSON(status, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":    true,
		"message":    "Successfully enrolled in course",
		"enrollment": enrollment,
	})
}
