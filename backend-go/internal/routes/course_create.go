package routes

import (
	"net/http"
	"strings"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateCourse(c *gin.Context) {
	courseService := services.NewCourseService()

	userRole := c.GetString("userRole")
	if userRole != "teacher" && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "Only teachers can create courses"})
		return
	}

	var body models.CreateCourseRequest

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	teacherIDHex := c.GetString("userId")
	teacherID, err := primitive.ObjectIDFromHex(teacherIDHex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid user ID"})
		return
	}

	course, err := courseService.CreateCourse(teacherID, body.Title, body.Code, body.Description)
	if err != nil {
		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "exists") {
			status = http.StatusBadRequest
		}
		c.JSON(status, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Course created successfully",
		"course":  course,
	})
}
