package utils

import (
	"context"
	"mime/multipart"
	"path/filepath"
	"strings"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/config"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CloudinaryResult struct {
	SecureURL string
	PublicID  string
	Duration  float64
	Bytes     int64
}

func GetMediaTypeAndResourceType(filename string, mimeType string) (string, string) {
	ext := strings.ToLower(filepath.Ext(filename))

	isAudio := ext == ".mp3" || ext == ".wav" || ext == ".ogg" || strings.HasPrefix(mimeType, "audio/")
	isVideo := ext == ".mp4" || ext == ".mkv" || ext == ".avi" || ext == ".mov" || ext == ".webm" || strings.HasPrefix(mimeType, "video/")
	isDoc := ext == ".pdf" || ext == ".docx" || ext == ".doc" || ext == ".pptx" || ext == ".ppt" ||
		strings.Contains(mimeType, "pdf") || strings.Contains(mimeType, "word") || strings.Contains(mimeType, "presentation")

	if isVideo {
		return "video", "video"
	}
	if isAudio {
		return "audio", "video" // Cloudinary treats audio as video resource type
	}
	if isDoc {
		return "document", "raw"
	}
	return "image", "image"
}

func UploadToCloudinary(file multipart.File, filename string, mimeType string) (*CloudinaryResult, error) {
	cfg := config.LoadConfig()
	cld, err := cloudinary.NewFromURL(cfg.CloudinaryURL)
	if err != nil {
		return nil, err
	}

	ctx := context.Background()

	_, resourceType := GetMediaTypeAndResourceType(filename, mimeType)

	resp, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:       "lms-lectures",
		ResourceType: resourceType,
		PublicID:     filename,
	})

	if err != nil {
		return nil, err
	}

	return &CloudinaryResult{
		SecureURL: resp.SecureURL,
		PublicID:  resp.PublicID,
		Duration:  extractDuration(resp),
		Bytes:     int64(resp.Bytes),
	}, nil
}

func extractDuration(resp *uploader.UploadResult) float64 {
	if resp.Response == nil {
		return 0
	}

	// Try to get from the Response field if it's a map
	if resMap, ok := resp.Response.(map[string]interface{}); ok {
		if dur, ok := resMap["duration"].(float64); ok {
			return dur
		}
	}

	return 0
}

func DeleteFromCloudinary(publicID string, resourceType string) error {
	cfg := config.LoadConfig()
	cld, err := cloudinary.NewFromURL(cfg.CloudinaryURL)
	if err != nil {
		return err
	}

	ctx := context.Background()
	_, err = cld.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID:     publicID,
		ResourceType: resourceType,
	})
	return err
}
