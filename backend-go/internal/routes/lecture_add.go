package routes

import (
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/utils"
	"github.com/gin-gonic/gin"
)

func AddLecture(c *gin.Context) {
	lectureService := services.NewLectureService()

	courseID := c.Param("courseId")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	title := c.PostForm("title")
	isPublishedVal := c.PostForm("isPublished")
	isPreviewVal := c.PostForm("isPreview")
	isPublished := isPublishedVal == "true"
	isPreview := isPreviewVal == "true"

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		file, header, err = c.Request.FormFile("File")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "File is required (key: 'file' or 'File')"})
			return
		}
	}
	defer file.Close()

	rawMime := header.Header.Get("Content-Type")
	mimeType := utils.DetectMimeType(file, rawMime)

	lecture, err := lectureService.AddLecture(courseID, userID, userRole, title, isPublished, isPreview, file, header.Filename, mimeType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Lecture added successfully",
		"lecture": lecture,
	})
}
