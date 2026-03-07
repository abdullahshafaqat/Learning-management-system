package services

import (
	"context"
	"errors"
	"time"

	courseRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/course"
	enrollmentRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/enrollments"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type EnrollmentService struct {
	repo       *enrollmentRepo.EnrollmentRepository
	courseRepo *courseRepo.CourseRepository
}

func NewEnrollmentService() *EnrollmentService {
	return &EnrollmentService{
		repo:       enrollmentRepo.NewEnrollmentRepository(),
		courseRepo: courseRepo.NewCourseRepository(),
	}
}

func (s *EnrollmentService) EnrollStudent(courseIDHex string, studentIDHex string) (*models.Enrollment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	courseID, err := primitive.ObjectIDFromHex(courseIDHex)
	if err != nil {
		return nil, errors.New("invalid course ID format")
	}
	studentID, err := primitive.ObjectIDFromHex(studentIDHex)
	if err != nil {
		return nil, errors.New("invalid student ID format")
	}

	_, err = s.courseRepo.FindOne(ctx, courseID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("course not found")
		}
		return nil, err
	}

	count, err := s.repo.CountByStudentAndCourse(ctx, studentID, courseID)
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("you are already enrolled in this course")
	}

	enrollment := models.Enrollment{
		ID:         primitive.NewObjectID(),
		CourseID:   courseID,
		StudentID:  studentID,
		Status:     "active",
		EnrolledAt: time.Now(),
	}

	_, err = s.repo.Create(ctx, enrollment)
	if err != nil {
		return nil, err
	}

	return &enrollment, nil
}

func (s *EnrollmentService) GetStudentEnrollments(studentIDHex string) ([]bson.M, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	studentID, err := primitive.ObjectIDFromHex(studentIDHex)
	if err != nil {
		return nil, errors.New("invalid student ID format")
	}
	return s.repo.FindByStudentID(ctx, studentID)
}

func (s *EnrollmentService) GetAllEnrollments() ([]bson.M, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return s.repo.FindAll(ctx)
}

func (s *EnrollmentService) RemoveEnrollment(courseIDHex string, studentIDHex string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	courseID, err := primitive.ObjectIDFromHex(courseIDHex)
	if err != nil {
		return errors.New("invalid course ID format")
	}
	studentID, err := primitive.ObjectIDFromHex(studentIDHex)
	if err != nil {
		return errors.New("invalid student ID format")
	}

	res, err := s.repo.Delete(ctx, courseID, studentID)
	if err != nil {
		return err
	}

	if res.DeletedCount == 0 {
		return errors.New("enrollment not found")
	}

	return nil
}
