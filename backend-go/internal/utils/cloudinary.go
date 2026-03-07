package utils

import (
	"context"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/config"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CloudinaryResult struct {
	SecureURL string
	PublicID  string
	Duration  float64
	Bytes     int64
}

func DetectMimeType(file multipart.File, providedMime string) string {

	if providedMime != "" &&
		providedMime != "application/octet-stream" &&
		providedMime != "binary/octet-stream" {
		return providedMime
	}

	buf := make([]byte, 512)
	n, err := file.Read(buf)
	if err != nil && err != io.EOF {
		return providedMime
	}

	file.Seek(0, io.SeekStart)

	return http.DetectContentType(buf[:n])
}

func GetMediaTypeAndResourceType(filename string, mimeType string) (string, string) {
	filename = strings.ToLower(filename)
	ext := filepath.Ext(filename)

	if mimeType != "" {
		mediatype, _, err := mime.ParseMediaType(mimeType)
		if err == nil {
			mimeType = mediatype
		}
	}
	mimeType = strings.ToLower(mimeType)

	isVideo := ext == ".mp4" || ext == ".mkv" || ext == ".avi" || ext == ".mov" || ext == ".webm" ||
		strings.HasPrefix(mimeType, "video/") ||
		strings.HasSuffix(filename, ".mp4") || strings.HasSuffix(filename, ".mkv")
	if isVideo {
		return "video", "video"
	}

	isAudio := ext == ".mp3" || ext == ".wav" || ext == ".ogg" || ext == ".m4a" ||
		strings.HasPrefix(mimeType, "audio/") ||
		strings.HasSuffix(filename, ".mp3") || strings.HasSuffix(filename, ".wav") || strings.HasSuffix(filename, ".m4a")
	if isAudio {
		return "audio", "video"
	}

	isDoc := ext == ".pdf" || ext == ".docx" || ext == ".doc" ||
		ext == ".pptx" || ext == ".ppt" || ext == ".xlsx" || ext == ".xls" ||
		ext == ".txt" || ext == ".csv" ||
		mimeType == "application/pdf" ||
		strings.Contains(mimeType, "pdf") ||
		strings.Contains(mimeType, "word") ||
		strings.Contains(mimeType, "presentation") ||
		strings.Contains(mimeType, "spreadsheet") ||
		strings.Contains(mimeType, "text/plain") ||
		strings.Contains(mimeType, "text/csv") ||
		strings.HasSuffix(filename, ".pdf") ||
		strings.HasSuffix(filename, ".docx") ||
		strings.HasSuffix(filename, ".doc") ||
		strings.HasSuffix(filename, ".pptx") ||
		strings.HasSuffix(filename, ".ppt")

	if isDoc {
		return "document", "raw"
	}

	return "image", "image"
}

func cleanPublicID(filename string) string {
	base := filepath.Base(filename)
	ext := filepath.Ext(base)
	nameOnly := strings.TrimSuffix(base, ext)

	var cleaned strings.Builder
	for _, r := range nameOnly {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			cleaned.WriteRune(r)
		} else if r == ' ' {
			cleaned.WriteRune('_')
		}
	}

	result := cleaned.String()
	if result == "" {
		result = "file"
	}
	return result
}

func UploadToCloudinary(ctx context.Context, file multipart.File, filename string, mimeType string) (*CloudinaryResult, error) {
	cfg := config.LoadConfig()
	cld, err := cloudinary.NewFromURL(cfg.CloudinaryURL)
	if err != nil {
		return nil, err
	}

	realMime := DetectMimeType(file, mimeType)

	_, resourceType := GetMediaTypeAndResourceType(filename, realMime)

	if strings.HasSuffix(strings.ToLower(filename), ".pdf") {
		resourceType = "raw"
	}

	cleanName := cleanPublicID(filename)
	timestamp := fmt.Sprintf("%d", time.Now().UnixNano()/1e6)
	publicID := "lms-lectures/" + cleanName + "_" + timestamp

	if resourceType == "raw" {
		publicID += filepath.Ext(filename)
	}

	resp, err := cld.Upload.Upload(ctx, file, uploader.UploadParams{
		ResourceType:   resourceType,
		PublicID:       publicID,
		UseFilename:    api.Bool(false),
		UniqueFilename: api.Bool(false),
	})
	if err != nil {
		return nil, err
	}

	if resp.SecureURL == "" {
		return nil, fmt.Errorf("cloudinary upload failed: empty response")
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
