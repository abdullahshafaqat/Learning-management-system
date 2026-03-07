package routes

import (
	"context"
	"net/http"
	"time"

	enrollmentRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/enrollments"
	lectureRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/lectures"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetLectureFileURL(c *gin.Context) {
	lectureID := c.Param("id")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	lRepo := lectureRepo.NewLectureRepository()
	lid, err := primitive.ObjectIDFromHex(lectureID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid lecture ID"})
		return
	}
	lecture, err := lRepo.FindOne(ctx, lid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "lecture not found"})
		return
	}

	if userRole == "student" {
		eRepo := enrollmentRepo.NewEnrollmentRepository()
		studentOID, err := primitive.ObjectIDFromHex(userID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid user ID"})
			return
		}
		count, err := eRepo.CountByStudentAndCourse(ctx, studentOID, lecture.CourseID)
		if err != nil || count == 0 {
			c.JSON(http.StatusForbidden, gin.H{"success": false, "error": "you are not enrolled in this course"})
			return
		}
	}

	if lecture.FileURL == "" {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "file not available for this lecture"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"url":       lecture.FileURL,
		"mediaType": lecture.MediaType,
	})
}
