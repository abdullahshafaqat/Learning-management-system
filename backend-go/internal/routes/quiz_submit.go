package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func SubmitQuiz(c *gin.Context) {
	var body models.SubmitQuizRequest

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	quizID := c.Param("quizId")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	quizService := services.NewQuizService()
	submission, err := quizService.SubmitQuiz(quizID, userID, userRole, body.Answers)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"submission": submission,
	})
}
