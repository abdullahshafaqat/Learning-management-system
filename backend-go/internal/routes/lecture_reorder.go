package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func ReorderLectures(c *gin.Context) {
	lectureService := services.NewLectureService()

	courseID := c.Param("courseId")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	var body models.ReorderLecturesRequest

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	err := lectureService.ReorderLectures(courseID, body.ReorderList, userID, userRole)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Lectures reordered successfully",
	})
}
