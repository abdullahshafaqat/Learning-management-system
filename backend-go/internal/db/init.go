package db

import (
	"context"
	"time"

	"github.com/abdullahshafaqat/Learning-management-system.git/internal/db/assignment"
	connection "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/connection"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/db/progress"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/db/quiz"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func InitDB() {
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	qRepo := quiz.NewQuizRepository()
	_ = qRepo.InitIndexes(ctx)

	pRepo := progress.NewProgressRepository()
	_ = pRepo.InitIndexes(ctx)

	aRepo := assignment.NewAssignmentRepository()
	_ = aRepo.InitIndexes(ctx)

	usersCol := connection.GetCollection("users")
	_, _ = usersCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "username", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	})

	coursesCol := connection.GetCollection("courses")
	_, _ = coursesCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "code", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	})

	enrollmentsCol := connection.GetCollection("enrollments")
	_, _ = enrollmentsCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "studentId", Value: 1}, {Key: "courseId", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	})
}
