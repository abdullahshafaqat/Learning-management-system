package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func GetQuiz(c *gin.Context) {
	quizID := c.Param("quizId")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	quizService := services.NewQuizService()
	quiz, err := quizService.GetQuiz(quizID, userID, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"quiz":    quiz,
	})
}
