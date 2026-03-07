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

	lecture, err := s.lectureRepo.FindOne(ctx, lectureID)
	if err != nil {
		return nil, errors.New("lecture not found")
	}

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

func (s *QuizService) GetQuiz(quizIDHex, userIDHex, userRole string) (map[string]interface{}, error) {
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

	if userRole == "student" {
		for i := range quiz.Questions {
			quiz.Questions[i].Correct = -1
		}
	}

	response := map[string]interface{}{
		"quiz": quiz,
	}

	if userRole == "student" {
		userID, _ := primitive.ObjectIDFromHex(userIDHex)
		submission, err := s.repo.GetSubmission(ctx, quizID, userID)
		if err == nil && submission != nil {
			response["isSubmitted"] = true
			response["score"] = submission.Score
		} else {
			response["isSubmitted"] = false
		}
	}

	return response, nil
}

func (s *QuizService) SubmitQuiz(quizIDHex, userIDHex, userRole string, answers []int) (*models.Submission, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

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

	existing, err := s.repo.GetSubmission(ctx, quizID, studentID)
	if err == nil && existing != nil {
		return nil, errors.New("already submitted")
	} else if err != mongo.ErrNoDocuments && err != nil {
		return nil, err
	}

	quiz, err := s.repo.GetQuiz(ctx, quizID)
	if err != nil {
		return nil, err
	}

	if len(answers) != len(quiz.Questions) {
		return nil, fmt.Errorf("answers count mismatch: expected %d but got %d", len(quiz.Questions), len(answers))
	}

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

	lecture, err := s.lectureRepo.FindOne(ctx, quiz.LectureID)
	if err == nil && lecture != nil {
		progressService := NewProgressService()
		err = progressService.MarkQuizCompleted(userIDHex, lecture.CourseID.Hex(), quizIDHex)
		if err != nil {
			return nil, fmt.Errorf("quiz submitted but progress update failed: %v", err)
		}
	}

	return &submission, nil
}

func (s *QuizService) GetResults(quizIDHex, userIDHex, userRole string) (any, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	quizID, err := primitive.ObjectIDFromHex(quizIDHex)
	if err != nil {
		return nil, errors.New("invalid quiz ID format")
	}

	if userRole != "admin" {
		quiz, err := s.repo.GetQuiz(ctx, quizID)
		if err != nil {
			return nil, errors.New("quiz not found")
		}
		lecture, err := s.lectureRepo.FindOne(ctx, quiz.LectureID)
		if err != nil {
			return nil, errors.New("lecture not found")
		}
		course, err := s.courseRepo.FindOne(ctx, lecture.CourseID)
		if err != nil {
			return nil, errors.New("course not found")
		}
		if course.TeacherID.Hex() != userIDHex {
			return nil, errors.New("access denied: you do not own this course")
		}
	}

	return s.repo.GetResults(ctx, quizID)
}

func (s *QuizService) GetQuizzesByCourse(courseIDHex, userIDHex, userRole string) ([]models.Quiz, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	courseID, err := primitive.ObjectIDFromHex(courseIDHex)
	if err != nil {
		return nil, errors.New("invalid course ID format")
	}

	lectures, err := s.lectureRepo.FindAllByCourseID(ctx, courseID)
	if err != nil {
		return nil, err
	}

	if len(lectures) == 0 {
		return []models.Quiz{}, nil
	}

	lectureIDs := make([]primitive.ObjectID, len(lectures))
	for i, l := range lectures {
		lectureIDs[i] = l.ID
	}

	quizzes, err := s.repo.FindAllByLectureIDs(ctx, lectureIDs)
	if err != nil {
		return nil, err
	}

	if userRole == "student" {
		for i := range quizzes {
			for j := range quizzes[i].Questions {
				quizzes[i].Questions[j].Correct = -1
			}
		}
	}

	return quizzes, nil
}
