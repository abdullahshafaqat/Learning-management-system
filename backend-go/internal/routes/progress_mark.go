package routes

import (
	"net/http"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func MarkLectureCompleted(c *gin.Context) {
	courseID := c.Param("courseId")
	lectureID := c.Param("lectureId")
	studentID := c.GetString("userId")

	progressService := services.NewProgressService()
	err := progressService.MarkLectureCompleted(studentID, courseID, lectureID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Lecture marked as completed",
	})
}
