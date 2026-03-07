package services

import (
	"context"
	"errors"
	"time"

	assignmentRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/assignment"
	courseRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/course"
	lectureRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/lectures"
	progressRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/progress"
	quizRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/quiz"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type ProgressService struct {
	repo           *progressRepo.ProgressRepository
	courseRepo     *courseRepo.CourseRepository
	lectureRepo    *lectureRepo.LectureRepository
	quizRepo       *quizRepo.QuizRepository
	assignmentRepo *assignmentRepo.AssignmentRepository
}

func NewProgressService() *ProgressService {
	return &ProgressService{
		repo:           progressRepo.NewProgressRepository(),
		courseRepo:     courseRepo.NewCourseRepository(),
		lectureRepo:    lectureRepo.NewLectureRepository(),
		quizRepo:       quizRepo.NewQuizRepository(),
		assignmentRepo: assignmentRepo.NewAssignmentRepository(),
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

	for _, id := range progress.LecturesCompleted {
		if id == lectureID {
			return nil
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

	for _, id := range progress.QuizzesCompleted {
		if id == quizID {
			return nil
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

func (s *ProgressService) GetAdminCourseProgress(courseIDHex, userIDHex, userRole string) (any, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	courseID, err := primitive.ObjectIDFromHex(courseIDHex)
	if err != nil {
		return nil, errors.New("invalid course ID format")
	}

	if userRole == "teacher" {
		userID, err := primitive.ObjectIDFromHex(userIDHex)
		if err != nil {
			return nil, errors.New("invalid user ID format")
		}
		course, err := s.courseRepo.FindOne(ctx, courseID)
		if err != nil {
			return nil, errors.New("course not found")
		}
		if course.TeacherID != userID {
			return nil, errors.New("access denied: you do not own this course")
		}
	}

	results, err := s.repo.GetCourseProgress(ctx, courseID)
	if err != nil {
		return nil, err
	}

	assignCount, err := s.assignmentRepo.CountByCourseID(ctx, courseID)
	if err != nil {
		return nil, err
	}

	return gin.H{"progress": results, "assignmentCount": assignCount}, nil
}

func (s *ProgressService) GetGlobalAnalytics() (any, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pipeline := mongo.Pipeline{
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "teacherId",
			"foreignField": "_id",
			"as":           "teacher",
		}}},
		{{Key: "$unwind", Value: bson.M{
			"path":                       "$teacher",
			"preserveNullAndEmptyArrays": true,
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "enrollments",
			"localField":   "_id",
			"foreignField": "courseId",
			"as":           "enrollments",
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "enrollments.studentId",
			"foreignField": "_id",
			"as":           "enrolledStudents",
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "progress",
			"localField":   "_id",
			"foreignField": "courseId",
			"as":           "progress",
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "assignments",
			"localField":   "_id",
			"foreignField": "courseId",
			"as":           "courseAssignments",
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from": "submissions",
			"let":  bson.M{"courseId": "$_id"},
			"pipeline": mongo.Pipeline{
				{{Key: "$lookup", Value: bson.M{
					"from":         "quizzes",
					"localField":   "quizId",
					"foreignField": "_id",
					"as":           "quiz",
				}}},
				{{Key: "$unwind", Value: "$quiz"}},
				{{Key: "$match", Value: bson.M{
					"$expr": bson.M{
						"$eq": []any{"$quiz.courseId", "$$courseId"},
					},
				}}},
			},
			"as": "submissions",
		}}},
		{{Key: "$project", Value: bson.M{
			"_id":                  0,
			"id":                   bson.M{"$toString": "$_id"},
			"title":                1,
			"teacherName":          "$teacher.username",
			"enrollmentCount":      bson.M{"$size": "$enrollments"},
			"assignmentCount":      bson.M{"$size": "$courseAssignments"},
			"avgCompletion":        bson.M{"$ifNull": []any{bson.M{"$avg": "$progress.percentage"}, 0}},
			"enrolledStudentNames": "$enrolledStudents.username",
			"avgQuizScore":         bson.M{"$ifNull": []any{bson.M{"$avg": "$submissions.score"}, 0}},
		}}},
	}

	cursor, err := s.courseRepo.GetCollection().Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var analytics []bson.M
	if err := cursor.All(ctx, &analytics); err != nil {
		return nil, err
	}

	return analytics, nil
}

func (s *ProgressService) GetTeacherAnalytics(teacherIDHex string) (any, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	teacherID, err := primitive.ObjectIDFromHex(teacherIDHex)
	if err != nil {
		return nil, errors.New("invalid teacher ID format")
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"teacherId": teacherID}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "teacherId",
			"foreignField": "_id",
			"as":           "teacher",
		}}},
		{{Key: "$unwind", Value: bson.M{
			"path":                       "$teacher",
			"preserveNullAndEmptyArrays": true,
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "enrollments",
			"localField":   "_id",
			"foreignField": "courseId",
			"as":           "enrollments",
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "enrollments.studentId",
			"foreignField": "_id",
			"as":           "enrolledStudents",
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "progress",
			"localField":   "_id",
			"foreignField": "courseId",
			"as":           "progress",
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "assignments",
			"localField":   "_id",
			"foreignField": "courseId",
			"as":           "courseAssignments",
		}}},
		{{Key: "$project", Value: bson.M{
			"_id":                  0,
			"id":                   bson.M{"$toString": "$_id"},
			"title":                1,
			"teacherName":          "$teacher.username",
			"enrollmentCount":      bson.M{"$size": "$enrollments"},
			"avgCompletion":        bson.M{"$ifNull": []any{bson.M{"$avg": "$progress.percentage"}, 0}},
			"enrolledStudentNames": "$enrolledStudents.username",
			"assignmentCount":      bson.M{"$size": "$courseAssignments"},
		}}},
	}

	cursor, err := s.courseRepo.GetCollection().Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var analytics []bson.M
	if err := cursor.All(ctx, &analytics); err != nil {
		return nil, err
	}

	return analytics, nil
}

func (s *ProgressService) updateAndSave(ctx context.Context, progress *models.Progress) error {
	totalLectures, err := s.countLecturesInCourse(ctx, progress.CourseID)
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
		progress.Percentage = 100
	}

	_, err = s.repo.CreateOrUpdateProgress(ctx, *progress)
	return err
}

func (s *ProgressService) getOrCreateProgress(ctx context.Context, studentID, courseID primitive.ObjectID) (*models.Progress, error) {
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

func (s *ProgressService) countLecturesInCourse(ctx context.Context, courseID primitive.ObjectID) (int64, error) {
	lectures, err := s.lectureRepo.FindAllByCourseID(ctx, courseID)
	if err != nil {
		return 0, err
	}

	return int64(len(lectures)), nil
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
