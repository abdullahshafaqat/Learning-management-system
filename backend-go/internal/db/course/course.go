package course

import (
	"context"

	connection "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/connection"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type CourseRepository struct {
	collection *mongo.Collection
}

func NewCourseRepository() *CourseRepository {
	return &CourseRepository{
		collection: connection.GetCollection("courses"),
	}
}

func (r *CourseRepository) CountByCode(ctx context.Context, code string) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{"code": code})
}

func (r *CourseRepository) CreateCourse(ctx context.Context, course models.Course) (*mongo.InsertOneResult, error) {
	return r.collection.InsertOne(ctx, course)
}

func (r *CourseRepository) FindByTeacherID(ctx context.Context, teacherID primitive.ObjectID) ([]models.Course, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"teacherId": teacherID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var courses []models.Course
	if err = cursor.All(ctx, &courses); err != nil {
		return nil, err
	}
	return courses, nil
}

func (r *CourseRepository) FindAll(ctx context.Context, filter bson.M, page, limit int) ([]bson.M, int64, error) {
	skip := (page - 1) * limit

	// 1. Get Total Count
	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// 2. Aggregate with Filter, Lookup, Skip, Limit
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "teacherId",
			"foreignField": "_id",
			"as":           "teacher",
		}}},
		{{Key: "$unwind", Value: "$teacher"}},
		{{Key: "$project", Value: bson.M{
			"title":       1,
			"code":        1,
			"description": 1,
			"status":      1,
			"createdAt":   1,
			"teacher": bson.M{
				"_id":   "$teacher._id",
				"email": "$teacher.email",
				"name":  "$teacher.username",
			},
		}}},
		{{Key: "$skip", Value: skip}},
		{{Key: "$limit", Value: limit}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var courses []bson.M
	if err = cursor.All(ctx, &courses); err != nil {
		return nil, 0, err
	}
	return courses, total, nil
}

func (r *CourseRepository) FindOne(ctx context.Context, courseID primitive.ObjectID) (*models.Course, error) {
	var course models.Course
	err := r.collection.FindOne(ctx, bson.M{"_id": courseID}).Decode(&course)
	if err != nil {
		return nil, err
	}
	return &course, nil
}

func (r *CourseRepository) UpdateOne(ctx context.Context, courseID primitive.ObjectID, updates bson.M) (*mongo.UpdateResult, error) {
	return r.collection.UpdateOne(ctx, bson.M{"_id": courseID}, updates)
}

func (r *CourseRepository) DeleteOne(ctx context.Context, courseID primitive.ObjectID) (*mongo.DeleteResult, error) {
	return r.collection.DeleteOne(ctx, bson.M{"_id": courseID})
}
