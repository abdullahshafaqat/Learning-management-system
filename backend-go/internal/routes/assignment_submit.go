package routes

import (
	"mime/multipart"
	"net/http"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/utils"
	"github.com/gin-gonic/gin"
)

func SubmitAssignment(c *gin.Context) {
	assignmentID := c.Param("id")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	text := c.PostForm("text")

	var (
		file     multipart.File
		filename string
		mimeType string
	)

	f, header, err := c.Request.FormFile("file")
	if err == nil {
		file = f
		defer file.Close()
		rawMime := header.Header.Get("Content-Type")
		mimeType = utils.DetectMimeType(file, rawMime)
		filename = header.Filename
	}

	if text == "" && file == nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "text or file is required"})
		return
	}

	service := services.NewAssignmentService()
	submission, submitErr := service.SubmitAssignment(assignmentID, userID, userRole, text, file, filename, mimeType)
	if submitErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": submitErr.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":    true,
		"submission": submission,
	})
}
