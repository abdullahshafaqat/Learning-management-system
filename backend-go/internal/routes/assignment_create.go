package routes

import (
	"mime/multipart"
	"net/http"
	"strconv"
	"time"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/services"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/utils"
	"github.com/gin-gonic/gin"
)

func CreateAssignment(c *gin.Context) {
	title := c.PostForm("title")
	description := c.PostForm("description")
	instructions := c.PostForm("instructions")
	dueDateStr := c.PostForm("dueDate")
	maxMarksStr := c.PostForm("maxMarks")

	if title == "" || description == "" || dueDateStr == "" || maxMarksStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "missing required fields"})
		return
	}

	dueDate, err := time.Parse(time.RFC3339, dueDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid dueDate format (use RFC3339)"})
		return
	}

	maxMarks, err := strconv.ParseFloat(maxMarksStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "invalid maxMarks"})
		return
	}

	var (
		attachment multipart.File
		filename   string
		mimeType   string
	)
	if f, header, err := c.Request.FormFile("attachment"); err == nil {
		attachment = f
		filename = header.Filename
		rawMime := header.Header.Get("Content-Type")
		mimeType = utils.DetectMimeType(f, rawMime)
		defer f.Close()
	}

	lectureID := c.Param("lectureId")
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	service := services.NewAssignmentService()
	assignment, err := service.CreateAssignment(lectureID, userID, userRole, title, description, instructions, dueDate, maxMarks, attachment, filename, mimeType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":    true,
		"message":    "Assignment created successfully",
		"assignment": assignment,
	})
}
