package db

import (
	"context"
	"log"
	"time"

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

	// Initialize Quiz Indexes
	qRepo := quiz.NewQuizRepository()
	_ = qRepo.InitIndexes(ctx)

	// Initialize Progress Indexes
	pRepo := progress.NewProgressRepository()
	_ = pRepo.InitIndexes(ctx)

	// Users: unique email and username
	usersCol := connection.GetCollection("users")
	_, err := usersCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "username", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	})
	if err != nil {
		log.Printf("Warning: Failed to create user indexes: %v", err)
	}

	// Courses: unique code
	coursesCol := connection.GetCollection("courses")
	_, err = coursesCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "code", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	})
	if err != nil {
		log.Printf("Warning: Failed to create course indexes: %v", err)
	}

	// Enrollments: unique compound (studentId, courseId)
	enrollmentsCol := connection.GetCollection("enrollments")
	_, err = enrollmentsCol.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "studentId", Value: 1}, {Key: "courseId", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	})
	if err != nil {
		log.Printf("Warning: Failed to create enrollment indexes: %v", err)
	}
}
