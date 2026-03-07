package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func CreateQuiz(c *gin.Context) {
	var body models.CreateQuizRequest

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	lectureID := c.Param("lectureId")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	quizService := services.NewQuizService()
	quiz, err := quizService.CreateQuiz(lectureID, body.Title, userID, userRole, body.Questions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"quiz":    quiz,
	})
}
