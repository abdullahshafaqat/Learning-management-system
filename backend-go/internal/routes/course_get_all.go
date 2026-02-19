package routes

import (
	"net/http"
	"regexp"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetAllCourses(c *gin.Context) {
	courseService := services.NewCourseService()

	// 1. Pagination
	page, limit := utils.CalculatePagination(c)

	// 2. Filters
	filter := bson.M{}

	// Search by Title (Regex)
	search := c.Query("search")
	if search != "" {
		filter["title"] = bson.M{"$regex": regexp.QuoteMeta(search), "$options": "i"}
	}

	// Filter by Teacher
	teacherID := c.Query("teacherId")
	if teacherID != "" {
		objID, err := primitive.ObjectIDFromHex(teacherID)
		if err == nil {
			filter["teacherId"] = objID
		}
	}

	// Filter by Published
	published := c.Query("published")
	if published == "true" {
		filter["status"] = "published"
	} else if published == "false" {
		filter["status"] = bson.M{"$ne": "published"}
	}

	// 3. Call Service
	courses, total, err := courseService.GetAllCourses(filter, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	// 4. Meta
	meta := utils.GetPaginationMeta(total, page, limit)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    courses,
		"meta":    meta,
	})
}
