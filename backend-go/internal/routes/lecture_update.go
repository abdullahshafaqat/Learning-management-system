package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func UpdateLecture(c *gin.Context) {
	lectureService := services.NewLectureService()

	lectureID := c.Param("id")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	lecture, err := lectureService.UpdateLecture(lectureID, updates, userID, userRole)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Lecture updated successfully",
		"lecture": lecture,
	})
}
