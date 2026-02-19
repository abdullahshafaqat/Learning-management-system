package services

import (
	"context"
	"errors"
	"mime/multipart"
	"time"

	courseRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/course"
	enrollmentRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/enrollments"
	lectureRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/lectures"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type LectureService struct {
	repo           *lectureRepo.LectureRepository
	courseRepo     *courseRepo.CourseRepository
	enrollmentRepo *enrollmentRepo.EnrollmentRepository
}

func NewLectureService() *LectureService {
	return &LectureService{
		repo:           lectureRepo.NewLectureRepository(),
		courseRepo:     courseRepo.NewCourseRepository(),
		enrollmentRepo: enrollmentRepo.NewEnrollmentRepository(),
	}
}

func (s *LectureService) AddLecture(courseIDHex string, userIDHex string, userRole string, title string, isPublished bool, isPreview bool, file multipart.File, filename string, mimeType string) (*models.Lecture, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	courseID, err := primitive.ObjectIDFromHex(courseIDHex)
	if err != nil {
		return nil, errors.New("invalid course ID format")
	}
	course, err := s.courseRepo.FindOne(ctx, courseID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("course not found")
		}
		return nil, err
	}

	if userRole != "admin" && course.TeacherID.Hex() != userIDHex {
		return nil, errors.New("access denied. You do not own this course")
	}

	// Auto-assign order
	lastLecture, err := s.repo.FindLastLecture(ctx, courseID)
	nextOrder := 1
	if err == nil {
		nextOrder = lastLecture.Order + 1
	}

	// Upload to Cloudinary
	uploadRes, err := utils.UploadToCloudinary(file, filename, mimeType)
	if err != nil {
		return nil, err
	}

	// Media Type Detection
	mediaType, _ := utils.GetMediaTypeAndResourceType(filename, mimeType)

	newLecture := models.Lecture{
		ID:          primitive.NewObjectID(),
		CourseID:    courseID,
		Title:       title,
		MediaType:   mediaType,
		FileURL:     uploadRes.SecureURL,
		PublicID:    uploadRes.PublicID,
		FileName:    filename,
		Order:       nextOrder,
		IsPublished: isPublished,
		IsPreview:   isPreview,
		Duration:    uploadRes.Duration,
		Size:        uploadRes.Bytes,
		CreatedAt:   time.Now(),
	}

	_, err = s.repo.Create(ctx, newLecture)
	if err != nil {
		return nil, err
	}

	return &newLecture, nil
}

func (s *LectureService) GetLectures(courseIDHex string, userIDHex string, userRole string, page, limit int) ([]models.Lecture, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	courseID, err := primitive.ObjectIDFromHex(courseIDHex)
	if err != nil {
		return nil, 0, errors.New("invalid course ID format")
	}
	course, err := s.courseRepo.FindOne(ctx, courseID)
	if err != nil {
		return nil, 0, errors.New("course not found")
	}

	filter := bson.M{}

	if userRole == "admin" || (userRole == "teacher" && course.TeacherID.Hex() == userIDHex) {
		// Return all
	} else if userRole == "student" {
		studID, err := primitive.ObjectIDFromHex(userIDHex)
		if err != nil {
			return nil, 0, errors.New("invalid user ID format")
		}
		count, err := s.enrollmentRepo.CountByStudentAndCourse(ctx, studID, courseID)
		if err != nil {
			return nil, 0, err
		}

		if count == 0 {
			filter["isPreview"] = true
		} else {
			filter["isPublished"] = true
		}
	} else {
		return nil, 0, errors.New("access denied")
	}

	return s.repo.FindByCourseID(ctx, courseID, filter, page, limit)
}

func (s *LectureService) DeleteLecture(lectureIDHex string, userIDHex string, userRole string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	lectureID, err := primitive.ObjectIDFromHex(lectureIDHex)
	if err != nil {
		return errors.New("invalid lecture ID format")
	}
	lecture, err := s.repo.FindOne(ctx, lectureID)
	if err != nil {
		return errors.New("lecture not found")
	}

	course, err := s.courseRepo.FindOne(ctx, lecture.CourseID)
	if err != nil {
		return errors.New("course not found associated with lecture")
	}

	if userRole != "admin" && course.TeacherID.Hex() != userIDHex {
		return errors.New("access denied")
	}

	// Delete from Cloudinary
	_, resourceType := utils.GetMediaTypeAndResourceType(lecture.FileName, "")
	utils.DeleteFromCloudinary(lecture.PublicID, resourceType)

	_, err = s.repo.DeleteOne(ctx, lectureID)
	return err
}

func (s *LectureService) UpdateLecture(lectureIDHex string, updates map[string]interface{}, userIDHex string, userRole string) (*models.Lecture, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	lectureID, err := primitive.ObjectIDFromHex(lectureIDHex)
	if err != nil {
		return nil, errors.New("invalid lecture ID format")
	}
	lecture, err := s.repo.FindOne(ctx, lectureID)
	if err != nil {
		return nil, errors.New("lecture not found")
	}

	course, err := s.courseRepo.FindOne(ctx, lecture.CourseID)
	if err != nil {
		return nil, errors.New("course not found associated with lecture")
	}

	if userRole != "admin" && course.TeacherID.Hex() != userIDHex {
		return nil, errors.New("access denied")
	}

	allowedFields := map[string]bool{"title": true, "isPublished": true, "isPreview": true, "order": true}
	updateFields := bson.M{}
	for k, v := range updates {
		if allowedFields[k] {
			updateFields[k] = v
		}
	}
	if len(updateFields) == 0 {
		return nil, errors.New("no valid fields to update")
	}

	_, err = s.repo.UpdateOne(ctx, lectureID, updateFields)
	if err != nil {
		return nil, err
	}

	// Return updated lecture
	return s.repo.FindOne(ctx, lectureID)
}

func (s *LectureService) ReorderLectures(courseIDHex string, reorderList []map[string]interface{}, userIDHex string, userRole string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	courseID, err := primitive.ObjectIDFromHex(courseIDHex)
	if err != nil {
		return errors.New("invalid course ID format")
	}
	course, err := s.courseRepo.FindOne(ctx, courseID)
	if err != nil {
		return errors.New("course not found")
	}

	if userRole != "admin" && course.TeacherID.Hex() != userIDHex {
		return errors.New("access denied")
	}

	var writeModels []mongo.WriteModel
	for _, item := range reorderList {
		idHex, ok := item["id"].(string)
		if !ok {
			continue
		}

		var order int
		switch v := item["order"].(type) {
		case float64:
			order = int(v)
		case int:
			order = v
		case int64:
			order = int(v)
		default:
			continue
		}

		lid, _ := primitive.ObjectIDFromHex(idHex)

		model := mongo.NewUpdateOneModel().
			SetFilter(bson.M{"_id": lid, "courseId": courseID}).
			SetUpdate(bson.M{"$set": bson.M{"order": order}})
		writeModels = append(writeModels, model)
	}

	if len(writeModels) > 0 {
		_, err = s.repo.BulkWrite(ctx, writeModels)
	}
	return err
}
