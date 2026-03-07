package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
)

func GetQuizResults(c *gin.Context) {
	quizID := c.Param("quizId")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	quizService := services.NewQuizService()
	results, err := quizService.GetResults(quizID, userID, userRole)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"results": results,
	})
}
