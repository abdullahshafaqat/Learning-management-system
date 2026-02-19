package services

import (
	"context"
	"errors"
	"time"

	lectureRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/lectures"
	progressRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/progress"
	quizRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/quiz"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ProgressService struct {
	repo        *progressRepo.ProgressRepository
	lectureRepo *lectureRepo.LectureRepository
	quizRepo    *quizRepo.QuizRepository
}

func NewProgressService() *ProgressService {
	return &ProgressService{
		repo:        progressRepo.NewProgressRepository(),
		lectureRepo: lectureRepo.NewLectureRepository(),
		quizRepo:    quizRepo.NewQuizRepository(),
	}
}

func (s *ProgressService) MarkLectureCompleted(studentIDHex, courseIDHex, lectureIDHex string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	studentID, err := primitive.ObjectIDFromHex(studentIDHex)
	if err != nil {
		return errors.New("invalid student ID format")
	}
	courseID, err := primitive.ObjectIDFromHex(courseIDHex)
	if err != nil {
		return errors.New("invalid course ID format")
	}
	lectureID, err := primitive.ObjectIDFromHex(lectureIDHex)
	if err != nil {
		return errors.New("invalid lecture ID format")
	}

	progress, err := s.getOrCreateProgress(ctx, studentID, courseID)
	if err != nil {
		return err
	}

	// Check if already completed
	for _, id := range progress.LecturesCompleted {
		if id == lectureID {
			return nil // Already marked
		}
	}

	progress.LecturesCompleted = append(progress.LecturesCompleted, lectureID)
	return s.updateAndSave(ctx, progress)
}

func (s *ProgressService) MarkQuizCompleted(studentIDHex, courseIDHex, quizIDHex string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	studentID, err := primitive.ObjectIDFromHex(studentIDHex)
	if err != nil {
		return errors.New("invalid student ID format")
	}
	courseID, err := primitive.ObjectIDFromHex(courseIDHex)
	if err != nil {
		return errors.New("invalid course ID format")
	}
	quizID, err := primitive.ObjectIDFromHex(quizIDHex)
	if err != nil {
		return errors.New("invalid quiz ID format")
	}

	progress, err := s.getOrCreateProgress(ctx, studentID, courseID)
	if err != nil {
		return err
	}

	// Check if already completed
	for _, id := range progress.QuizzesCompleted {
		if id == quizID {
			return nil // Already marked
		}
	}

	progress.QuizzesCompleted = append(progress.QuizzesCompleted, quizID)
	return s.updateAndSave(ctx, progress)
}

func (s *ProgressService) GetStudentProgress(studentIDHex, courseIDHex string) (*models.Progress, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	studentID, err := primitive.ObjectIDFromHex(studentIDHex)
	if err != nil {
		return nil, errors.New("invalid student ID format")
	}
	courseID, err := primitive.ObjectIDFromHex(courseIDHex)
	if err != nil {
		return nil, errors.New("invalid course ID format")
	}

	progress, err := s.repo.GetProgress(ctx, studentID, courseID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return &models.Progress{
				StudentID: studentID,
				CourseID:  courseID,
			}, nil
		}
		return nil, err
	}
	return progress, nil
}

func (s *ProgressService) GetAdminCourseProgress(courseIDHex string) ([]models.Progress, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	courseID, err := primitive.ObjectIDFromHex(courseIDHex)
	if err != nil {
		return nil, errors.New("invalid course ID format")
	}
	return s.repo.GetCourseProgress(ctx, courseID)
}

func (s *ProgressService) getOrCreateProgress(ctx context.Context, studentID, courseID primitive.ObjectID) (*models.Progress, error) {
	progress, err := s.repo.GetProgress(ctx, studentID, courseID)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return &models.Progress{
				StudentID:         studentID,
				CourseID:          courseID,
				LecturesCompleted: []primitive.ObjectID{},
				QuizzesCompleted:  []primitive.ObjectID{},
			}, nil
		}
		return nil, err
	}
	return progress, nil
}

func (s *ProgressService) updateAndSave(ctx context.Context, progress *models.Progress) error {
	// Calculate Percentage
	totalLectures, err := s.lectureRepo.CountByCourseID(ctx, progress.CourseID)
	if err != nil {
		return err
	}

	totalQuizzes, err := s.countQuizzesInCourse(ctx, progress.CourseID)
	if err != nil {
		return err
	}

	totalItems := totalLectures + totalQuizzes
	if totalItems > 0 {
		completedItems := int64(len(progress.LecturesCompleted) + len(progress.QuizzesCompleted))
		progress.Percentage = (float64(completedItems) / float64(totalItems)) * 100
	} else {
		progress.Percentage = 100 // No content = 100% complete
	}

	_, err = s.repo.CreateOrUpdateProgress(ctx, *progress)
	return err
}

func (s *ProgressService) countQuizzesInCourse(ctx context.Context, courseID primitive.ObjectID) (int64, error) {
	lectures, err := s.lectureRepo.FindAllByCourseID(ctx, courseID)
	if err != nil {
		return 0, err
	}

	if len(lectures) == 0 {
		return 0, nil
	}

	lectureIDs := make([]primitive.ObjectID, len(lectures))
	for i, l := range lectures {
		lectureIDs[i] = l.ID
	}

	return s.quizRepo.CountByLectureIDs(ctx, lectureIDs)
}
