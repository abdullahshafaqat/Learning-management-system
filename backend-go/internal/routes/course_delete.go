package routes

import (
	"net/http"
	"strings"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func DeleteCourse(c *gin.Context) {
	courseService := services.NewCourseService()

	courseID := c.Param("id")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	err := courseService.DeleteCourse(courseID, userID, userRole)
	if err != nil {
		status := http.StatusInternalServerError
		if strings.Contains(err.Error(), "not found") {
			status = http.StatusNotFound
		} else if strings.Contains(err.Error(), "access denied") {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Course deleted successfully",
	})
}
