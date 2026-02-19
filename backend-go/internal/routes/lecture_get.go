package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/utils"
	"github.com/gin-gonic/gin"
)

func GetLectures(c *gin.Context) {
	lectureService := services.NewLectureService()

	courseID := c.Param("courseId")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	// Pagination
	page, limit := utils.CalculatePagination(c)

	lectures, total, err := lectureService.GetLectures(courseID, userID, userRole, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	meta := utils.GetPaginationMeta(total, page, limit)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    lectures,
		"meta":    meta,
	})
}
