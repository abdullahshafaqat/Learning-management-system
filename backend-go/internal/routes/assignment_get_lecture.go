package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func GetLectureAssignments(c *gin.Context) {
	lectureID := c.Param("lectureId")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	service := services.NewAssignmentService()
	assignments, err := service.GetLectureAssignments(lectureID, userID, userRole)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    assignments,
	})
}

func GetCourseAssignments(c *gin.Context) {
	courseID := c.Param("courseId")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	service := services.NewAssignmentService()
	assignments, err := service.GetCourseAssignments(courseID, userID, userRole)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    assignments,
	})
}
