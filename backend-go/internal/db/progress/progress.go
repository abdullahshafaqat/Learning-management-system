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

func (r *ProgressRepository) GetCourseProgress(ctx context.Context, courseID primitive.ObjectID) ([]bson.M, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"courseId": courseID}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "studentId",
			"foreignField": "_id",
			"as":           "student",
		}}},
		{{Key: "$unwind", Value: "$student"}},
		{{Key: "$lookup", Value: bson.M{
			"from": "assignment_submissions",
			"let":  bson.M{"studentId": "$studentId", "courseId": courseID},
			"pipeline": mongo.Pipeline{
				{{Key: "$match", Value: bson.M{
					"$expr": bson.M{
						"$eq": []any{"$studentId", "$$studentId"},
					},
				}}},
				{{Key: "$lookup", Value: bson.M{
					"from":         "assignments",
					"localField":   "assignmentId",
					"foreignField": "_id",
					"as":           "assignment",
				}}},
				{{Key: "$unwind", Value: bson.M{
					"path":                       "$assignment",
					"preserveNullAndEmptyArrays": true,
				}}},
				{{Key: "$match", Value: bson.M{
					"$expr": bson.M{
						"$eq": []any{"$assignment.courseId", "$$courseId"},
					},
				}}},
				{{Key: "$project", Value: bson.M{"_id": 0, "id": bson.M{"$toString": "$_id"}}}},
			},
			"as": "assignmentsSubmitted",
		}}},
		{{Key: "$project", Value: bson.M{
			"_id":                  0,
			"id":                   bson.M{"$toString": "$_id"},
			"studentId":            bson.M{"$toString": "$studentId"},
			"studentName":          "$student.username",
			"studentEmail":         "$student.email",
			"percentage":           1,
			"lecturesCompleted":    1,
			"quizzesCompleted":     1,
			"assignmentsSubmitted": 1,
			"updatedAt":            1,
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []bson.M
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
