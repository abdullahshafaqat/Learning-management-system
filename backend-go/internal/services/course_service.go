package services

import (
	"context"
	"errors"
	"time"

	courseRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/course"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type CourseService struct {
	repo *courseRepo.CourseRepository
}

func NewCourseService() *CourseService {
	return &CourseService{
		repo: courseRepo.NewCourseRepository(),
	}
}

func (s *CourseService) CreateCourse(teacherID primitive.ObjectID, title, code, description string) (*models.Course, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	count, err := s.repo.CountByCode(ctx, code)
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("course code already exists")
	}

	newCourse := models.Course{
		ID:          primitive.NewObjectID(),
		TeacherID:   teacherID,
		Title:       title,
		Code:        code,
		Description: description,
		Status:      "published",
		CreatedAt:   time.Now(),
	}

	_, err = s.repo.CreateCourse(ctx, newCourse)
	if err != nil {
		return nil, err
	}

	return &newCourse, nil
}

func (s *CourseService) GetTeacherCourses(teacherID primitive.ObjectID) ([]models.Course, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return s.repo.FindByTeacherID(ctx, teacherID)
}

func (s *CourseService) GetAllCourses(filter bson.M, page, limit int) ([]bson.M, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return s.repo.FindAll(ctx, filter, page, limit)
}

func (s *CourseService) UpdateCourse(courseID string, updates map[string]interface{}, userID string, userRole string) (*models.Course, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(courseID)
	if err != nil {
		return nil, errors.New("invalid course ID format")
	}

	course, err := s.repo.FindOne(ctx, objID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("course not found")
		}
		return nil, err
	}

	if userRole != "admin" && course.TeacherID.Hex() != userID {
		return nil, errors.New("access denied. You do not own this course")
	}

	allowedFields := map[string]bool{"title": true, "code": true, "description": true, "status": true}
	safeUpdates := bson.M{}
	for k, v := range updates {
		if allowedFields[k] {
			safeUpdates[k] = v
		}
	}
	if len(safeUpdates) == 0 {
		return nil, errors.New("no valid fields to update")
	}

	updateDoc := bson.M{"$set": safeUpdates}
	_, err = s.repo.UpdateOne(ctx, objID, updateDoc)
	if err != nil {
		return nil, err
	}

	return s.repo.FindOne(ctx, objID)
}

func (s *CourseService) DeleteCourse(courseID string, userID string, userRole string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objID, err := primitive.ObjectIDFromHex(courseID)
	if err != nil {
		return errors.New("invalid course ID format")
	}

	course, err := s.repo.FindOne(ctx, objID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return errors.New("course not found")
		}
		return err
	}

	if userRole != "admin" && course.TeacherID.Hex() != userID {
		return errors.New("access denied. You do not own this course")
	}

	_, err = s.repo.DeleteOne(ctx, objID)
	return err
}
