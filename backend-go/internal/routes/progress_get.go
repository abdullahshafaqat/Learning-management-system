package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func GetStudentProgress(c *gin.Context) {
	courseID := c.Param("courseId")
	studentID := c.GetString("userId")

	progressService := services.NewProgressService()
	progress, err := progressService.GetStudentProgress(studentID, courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    progress,
	})
}

func GetAdminCourseProgress(c *gin.Context) {
	courseID := c.Param("courseId")

	progressService := services.NewProgressService()
	results, err := progressService.GetAdminCourseProgress(courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    results,
	})
}
