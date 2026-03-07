package services

import (
	"context"
	"errors"
	"mime/multipart"
	"time"

	assignmentRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/assignment"
	courseRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/course"
	enrollmentRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/enrollments"
	lectureRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/lectures"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/utils"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AssignmentService struct {
	repo           *assignmentRepo.AssignmentRepository
	lectureRepo    *lectureRepo.LectureRepository
	courseRepo     *courseRepo.CourseRepository
	enrollmentRepo *enrollmentRepo.EnrollmentRepository
}

func NewAssignmentService() *AssignmentService {
	return &AssignmentService{
		repo:           assignmentRepo.NewAssignmentRepository(),
		lectureRepo:    lectureRepo.NewLectureRepository(),
		courseRepo:     courseRepo.NewCourseRepository(),
		enrollmentRepo: enrollmentRepo.NewEnrollmentRepository(),
	}
}

func (s *AssignmentService) CreateAssignment(lectureIDHex, userIDHex, userRole, title, description, instructions string, dueDate time.Time, maxMarks float64, attachment multipart.File, filename, mimeType string) (*models.Assignment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	lectureID, err := primitive.ObjectIDFromHex(lectureIDHex)
	if err != nil {
		return nil, errors.New("invalid lecture ID format")
	}
	lecture, err := s.lectureRepo.FindOne(ctx, lectureID)
	if err != nil {
		return nil, errors.New("lecture not found")
	}

	course, err := s.courseRepo.FindOne(ctx, lecture.CourseID)
	if err != nil {
		return nil, errors.New("course not found")
	}

	if userRole != "admin" && course.TeacherID.Hex() != userIDHex {
		return nil, errors.New("access denied")
	}
	if dueDate.IsZero() {
		return nil, errors.New("due date is required")
	}
	if maxMarks <= 0 {
		return nil, errors.New("max marks must be greater than 0")
	}

	assignment := models.Assignment{
		ID:           primitive.NewObjectID(),
		CourseID:     lecture.CourseID,
		LectureID:    &lectureID,
		Title:        title,
		Description:  description,
		Instructions: instructions,
		DueDate:      dueDate,
		MaxMarks:     maxMarks,
		CreatedAt:    time.Now(),
	}

	if attachment != nil {
		uploadRes, err := utils.UploadToCloudinary(ctx, attachment, filename, mimeType)
		if err != nil {
			return nil, err
		}
		assignment.AttachmentURL = uploadRes.SecureURL
		assignment.AttachmentName = filename
	}
	creatorID, err := primitive.ObjectIDFromHex(userIDHex)
	if err != nil {
		return nil, errors.New("invalid user ID format")
	}
	assignment.CreatedBy = creatorID

	if _, err := s.repo.CreateAssignment(ctx, assignment); err != nil {
		return nil, err
	}
	return &assignment, nil
}

func (s *AssignmentService) GetLectureAssignments(lectureIDHex, userIDHex, userRole string) ([]models.Assignment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	lectureID, err := primitive.ObjectIDFromHex(lectureIDHex)
	if err != nil {
		return nil, errors.New("invalid lecture ID format")
	}
	lecture, err := s.lectureRepo.FindOne(ctx, lectureID)
	if err != nil {
		return nil, errors.New("lecture not found")
	}
	if err := s.ensureCourseAccess(ctx, lecture.CourseID, userIDHex, userRole); err != nil {
		return nil, err
	}

	return s.repo.FindAssignmentsByLectureID(ctx, lectureID)
}

func (s *AssignmentService) GetCourseAssignments(courseIDHex, userIDHex, userRole string) ([]models.Assignment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	courseID, err := primitive.ObjectIDFromHex(courseIDHex)
	if err != nil {
		return nil, errors.New("invalid course ID format")
	}
	if err := s.ensureCourseAccess(ctx, courseID, userIDHex, userRole); err != nil {
		return nil, err
	}
	return s.repo.FindAssignmentsByCourseID(ctx, courseID)
}

func (s *AssignmentService) GetAssignment(assignmentIDHex, userIDHex, userRole string) (*models.Assignment, *models.AssignmentSubmission, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	assignmentID, err := primitive.ObjectIDFromHex(assignmentIDHex)
	if err != nil {
		return nil, nil, errors.New("invalid assignment ID format")
	}

	assignment, err := s.repo.FindAssignmentByID(ctx, assignmentID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil, errors.New("assignment not found")
		}
		return nil, nil, err
	}

	if err := s.ensureCourseAccess(ctx, assignment.CourseID, userIDHex, userRole); err != nil {
		return nil, nil, err
	}

	var mySubmission *models.AssignmentSubmission
	if userRole == "student" {
		studentID, _ := primitive.ObjectIDFromHex(userIDHex)
		submission, err := s.repo.FindSubmissionByAssignmentAndStudent(ctx, assignment.ID, studentID)
		if err == nil {
			mySubmission = submission
		} else if err != mongo.ErrNoDocuments {
			return nil, nil, err
		}
	}

	return assignment, mySubmission, nil
}

func (s *AssignmentService) SubmitAssignment(assignmentIDHex, userIDHex, userRole, text string, file multipart.File, filename, mimeType string) (*models.AssignmentSubmission, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	if userRole != "student" {
		return nil, errors.New("only students can submit assignments")
	}

	assignmentID, err := primitive.ObjectIDFromHex(assignmentIDHex)
	if err != nil {
		return nil, errors.New("invalid assignment ID format")
	}
	studentID, err := primitive.ObjectIDFromHex(userIDHex)
	if err != nil {
		return nil, errors.New("invalid student ID format")
	}

	assignment, err := s.repo.FindAssignmentByID(ctx, assignmentID)
	if err != nil {
		return nil, errors.New("assignment not found")
	}

	if time.Now().After(assignment.DueDate) {
		return nil, errors.New("deadline has passed")
	}

	count, err := s.enrollmentRepo.CountByStudentAndCourse(ctx, studentID, assignment.CourseID)
	if err != nil {
		return nil, err
	}
	if count == 0 {
		return nil, errors.New("you are not enrolled in this course")
	}

	existing, err := s.repo.FindSubmissionByAssignmentAndStudent(ctx, assignmentID, studentID)
	if err != nil && err != mongo.ErrNoDocuments {
		return nil, err
	}
	if existing != nil {
		if time.Now().After(assignment.DueDate) {
			return nil, errors.New("deadline has passed")
		}
		existing.Text = text
		existing.SubmittedAt = time.Now()
		existing.Status = "submitted"
		if file != nil {
			uploadRes, err := utils.UploadToCloudinary(ctx, file, filename, mimeType)
			if err != nil {
				return nil, err
			}
			existing.FileURL = uploadRes.SecureURL
			existing.PublicID = uploadRes.PublicID
			existing.FileName = filename
		}

		if _, err := s.repo.UpdateSubmission(ctx, existing.ID, bson.M{
			"text":        existing.Text,
			"fileUrl":     existing.FileURL,
			"fileName":    existing.FileName,
			"publicId":    existing.PublicID,
			"submittedAt": existing.SubmittedAt,
			"status":      existing.Status,
		}); err != nil {
			return nil, err
		}
		return existing, nil
	}

	if text == "" && file == nil {
		return nil, errors.New("text or file is required")
	}

	submission := models.AssignmentSubmission{
		ID:           primitive.NewObjectID(),
		AssignmentID: assignmentID,
		StudentID:    studentID,
		Text:         text,
		SubmittedAt:  time.Now(),
	}

	if file != nil {
		uploadRes, err := utils.UploadToCloudinary(ctx, file, filename, mimeType)
		if err != nil {
			return nil, err
		}
		submission.FileURL = uploadRes.SecureURL
		submission.PublicID = uploadRes.PublicID
		submission.FileName = filename
	}

	if _, err := s.repo.CreateSubmission(ctx, submission); err != nil {
		return nil, err
	}
	return &submission, nil
}

func (s *AssignmentService) GetStudentAssignments(studentIDHex string) ([]bson.M, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	studentID, err := primitive.ObjectIDFromHex(studentIDHex)
	if err != nil {
		return nil, errors.New("invalid student ID format")
	}
	return s.repo.FindStudentAssignments(ctx, studentID)
}

func (s *AssignmentService) GetAssignmentSubmissions(assignmentIDHex, userIDHex, userRole string) ([]bson.M, *models.Assignment, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	assignmentID, err := primitive.ObjectIDFromHex(assignmentIDHex)
	if err != nil {
		return nil, nil, errors.New("invalid assignment ID format")
	}
	assignment, err := s.repo.FindAssignmentByID(ctx, assignmentID)
	if err != nil {
		return nil, nil, errors.New("assignment not found")
	}
	if userRole == "student" {
		return nil, nil, errors.New("access denied")
	}
	if err := s.ensureCourseAccess(ctx, assignment.CourseID, userIDHex, userRole); err != nil {
		return nil, nil, err
	}

	results, err := s.repo.FindSubmissionsByAssignment(ctx, assignmentID)
	if err != nil {
		return nil, nil, err
	}
	return results, assignment, nil
}

func (s *AssignmentService) GradeSubmission(submissionIDHex, graderIDHex, userRole string, marks float64, feedback string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if userRole != "teacher" && userRole != "admin" {
		return errors.New("access denied")
	}

	submissionID, err := primitive.ObjectIDFromHex(submissionIDHex)
	if err != nil {
		return errors.New("invalid submission ID format")
	}
	graderID, err := primitive.ObjectIDFromHex(graderIDHex)
	if err != nil {
		return errors.New("invalid grader ID format")
	}

	submission, err := s.repo.FindSubmissionByID(ctx, submissionID)
	if err != nil {
		return errors.New("submission not found")
	}
	if submission.GradedAt != nil || submission.Marks != nil {
		return errors.New("submission already graded")
	}
	assignment, err := s.repo.FindAssignmentByID(ctx, submission.AssignmentID)
	if err != nil {
		return errors.New("assignment not found")
	}
	if err := s.ensureCourseAccess(ctx, assignment.CourseID, graderIDHex, userRole); err != nil {
		return err
	}
	if marks < 0 || marks > assignment.MaxMarks {
		return errors.New("marks must be between 0 and max marks")
	}

	_, err = s.repo.UpdateSubmissionGrade(ctx, submissionID, marks, feedback, graderID)
	return err
}

func (s *AssignmentService) ensureCourseAccess(ctx context.Context, courseID primitive.ObjectID, userIDHex, userRole string) error {
	if userRole == "admin" {
		return nil
	}

	if userRole == "teacher" {
		course, err := s.courseRepo.FindOne(ctx, courseID)
		if err != nil {
			return errors.New("course not found")
		}
		if course.TeacherID.Hex() != userIDHex {
			return errors.New("access denied")
		}
		return nil
	}

	if userRole == "student" {
		studentID, err := primitive.ObjectIDFromHex(userIDHex)
		if err != nil {
			return errors.New("invalid user ID format")
		}
		count, err := s.enrollmentRepo.CountByStudentAndCourse(ctx, studentID, courseID)
		if err != nil {
			return err
		}
		if count == 0 {
			return errors.New("access denied")
		}
		return nil
	}

	return errors.New("access denied")
}
