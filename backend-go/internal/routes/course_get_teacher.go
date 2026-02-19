package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetTeacherCourses(c *gin.Context) {
	courseService := services.NewCourseService()

	teacherIDHex := c.GetString("userId")
	teacherID, _ := primitive.ObjectIDFromHex(teacherIDHex)

	courses, err := courseService.GetTeacherCourses(teacherID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"courses": courses,
	})
}
