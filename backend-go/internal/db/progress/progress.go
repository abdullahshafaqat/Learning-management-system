package progress

import (
	"context"
	"time"

	connection "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/connection"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ProgressRepository struct {
	collection *mongo.Collection
}

func NewProgressRepository() *ProgressRepository {
	return &ProgressRepository{
		collection: connection.GetCollection("progress"),
	}
}

func (r *ProgressRepository) CreateOrUpdateProgress(ctx context.Context, progress models.Progress) (*mongo.UpdateResult, error) {
	filter := bson.M{
		"studentId": progress.StudentID,
		"courseId":  progress.CourseID,
	}

	update := bson.M{
		"$set": bson.M{
			"lecturesCompleted": progress.LecturesCompleted,
			"quizzesCompleted":  progress.QuizzesCompleted,
			"percentage":        progress.Percentage,
			"updatedAt":         time.Now(),
		},
		"$setOnInsert": bson.M{
			"_id": primitive.NewObjectID(),
		},
	}

	opts := options.Update().SetUpsert(true)
	return r.collection.UpdateOne(ctx, filter, update, opts)
}

func (r *ProgressRepository) GetProgress(ctx context.Context, studentID, courseID primitive.ObjectID) (*models.Progress, error) {
	var progress models.Progress
	err := r.collection.FindOne(ctx, bson.M{
		"studentId": studentID,
		"courseId":  courseID,
	}).Decode(&progress)

	if err != nil {
		return nil, err
	}
	return &progress, nil
}

func (r *ProgressRepository) GetCourseProgress(ctx context.Context, courseID primitive.ObjectID) ([]models.Progress, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"courseId": courseID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []models.Progress
	if err = cursor.All(ctx, &results); err != nil {
		return nil, err
	}
	return results, nil
}

func (r *ProgressRepository) InitIndexes(ctx context.Context) error {
	_, err := r.collection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "studentId", Value: 1}, {Key: "courseId", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.M{"courseId": 1},
		},
	})
	return err
}
