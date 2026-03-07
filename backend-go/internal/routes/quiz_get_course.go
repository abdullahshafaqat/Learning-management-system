package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func GetCourseQuizzes(c *gin.Context) {
	courseID := c.Param("courseId")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	quizService := services.NewQuizService()
	quizzes, err := quizService.GetQuizzesByCourse(courseID, userID, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    quizzes,
	})
}
