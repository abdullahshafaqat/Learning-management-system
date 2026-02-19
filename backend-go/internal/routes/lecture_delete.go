package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func DeleteLecture(c *gin.Context) {
	lectureService := services.NewLectureService()

	lectureID := c.Param("id")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	err := lectureService.DeleteLecture(lectureID, userID, userRole)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Lecture deleted successfully",
	})
}
