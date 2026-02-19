package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	courseRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/course"
	enrollmentRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/enrollments"
	lectureRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/lectures"
	quizRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/quiz"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type QuizService struct {
	repo           *quizRepo.QuizRepository
	courseRepo     *courseRepo.CourseRepository
	enrollmentRepo *enrollmentRepo.EnrollmentRepository
	lectureRepo    *lectureRepo.LectureRepository
}

func NewQuizService() *QuizService {
	return &QuizService{
		repo:           quizRepo.NewQuizRepository(),
		courseRepo:     courseRepo.NewCourseRepository(),
		enrollmentRepo: enrollmentRepo.NewEnrollmentRepository(),
		lectureRepo:    lectureRepo.NewLectureRepository(),
	}
}

func (s *QuizService) CreateQuiz(lectureIDHex, title, userIDHex, userRole string, questions []models.Question) (*models.Quiz, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	lectureID, err := primitive.ObjectIDFromHex(lectureIDHex)
	if err != nil {
		return nil, errors.New("invalid lecture ID format")
	}

	userID, err := primitive.ObjectIDFromHex(userIDHex)
	if err != nil {
		return nil, errors.New("invalid user ID format")
	}

	// Verify lecture exists
	lecture, err := s.lectureRepo.FindOne(ctx, lectureID)
	if err != nil {
		return nil, errors.New("lecture not found")
	}

	// Verify ownership: admin bypasses, teacher must own the course
	if userRole != "admin" {
		course, err := s.courseRepo.FindOne(ctx, lecture.CourseID)
		if err != nil {
			return nil, errors.New("course not found")
		}
		if course.TeacherID.Hex() != userIDHex {
			return nil, errors.New("access denied: you do not own this course")
		}
	}

	quiz := models.Quiz{
		ID:        primitive.NewObjectID(),
		LectureID: lectureID,
		Title:     title,
		Questions: questions,
		CreatedBy: userID,
		CreatedAt: time.Now(),
	}

	_, err = s.repo.CreateQuiz(ctx, quiz)
	if err != nil {
		return nil, err
	}
	return &quiz, nil
}

func (s *QuizService) GetQuiz(quizIDHex, userIDHex, userRole string) (*models.Quiz, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	quizID, err := primitive.ObjectIDFromHex(quizIDHex)
	if err != nil {
		return nil, errors.New("invalid quiz ID format")
	}

	quiz, err := s.repo.GetQuiz(ctx, quizID)
	if err != nil {
		return nil, err
	}

	// If student, HIDE correct answers for security
	if userRole == "student" {
		for i := range quiz.Questions {
			quiz.Questions[i].Correct = -1
		}
	}

	return quiz, nil
}

func (s *QuizService) SubmitQuiz(quizIDHex, userIDHex, userRole string, answers []int) (*models.Submission, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 0. Role Guard (Only students can submit)
	if userRole != "student" {
		return nil, errors.New("only students can submit quizzes")
	}

	quizID, err := primitive.ObjectIDFromHex(quizIDHex)
	if err != nil {
		return nil, errors.New("invalid quiz ID format")
	}

	studentID, err := primitive.ObjectIDFromHex(userIDHex)
	if err != nil {
		return nil, errors.New("invalid user ID format")
	}

	// 1. Check if already submitted
	existing, err := s.repo.GetSubmission(ctx, quizID, studentID)
	if err == nil && existing != nil {
		return nil, errors.New("already submitted")
	} else if err != mongo.ErrNoDocuments && err != nil {
		return nil, err
	}

	// 2. Fetch Quiz for grading
	quiz, err := s.repo.GetQuiz(ctx, quizID)
	if err != nil {
		return nil, err
	}

	// 2.1 Validate Answer Length
	if len(answers) != len(quiz.Questions) {
		return nil, fmt.Errorf("answers count mismatch: expected %d but got %d", len(quiz.Questions), len(answers))
	}

	// 3. Auto-Grade
	score := 0
	for i, q := range quiz.Questions {
		if answers[i] == q.Correct {
			score++
		}
	}

	submission := models.Submission{
		ID:        primitive.NewObjectID(),
		QuizID:    quizID,
		StudentID: studentID,
		Answers:   answers,
		Score:     score,
		Submitted: time.Now(),
	}

	_, err = s.repo.CreateSubmission(ctx, submission)
	if err != nil {
		return nil, err
	}

	// 4. Update Progress
	lecture, err := s.lectureRepo.FindOne(ctx, quiz.LectureID)
	if err == nil && lecture != nil {
		progressService := NewProgressService()
		err = progressService.MarkQuizCompleted(userIDHex, lecture.CourseID.Hex(), quizIDHex)
		if err != nil {
			// Log error but don't fail submission?
			// Or return error? Usually better to return error if progress tracking fails.
			return nil, fmt.Errorf("quiz submitted but progress update failed: %v", err)
		}
	}

	return &submission, nil
}

func (s *QuizService) GetResults(quizIDHex string) ([]models.Submission, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	quizID, err := primitive.ObjectIDFromHex(quizIDHex)
	if err != nil {
		return nil, errors.New("invalid quiz ID format")
	}

	return s.repo.GetResults(ctx, quizID)
}
