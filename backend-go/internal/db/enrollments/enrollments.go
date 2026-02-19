package enrollments

import (
	"context"

	connection "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/connection"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type EnrollmentRepository struct {
	collection *mongo.Collection
}

func NewEnrollmentRepository() *EnrollmentRepository {
	return &EnrollmentRepository{
		collection: connection.GetCollection("enrollments"),
	}
}

func (r *EnrollmentRepository) CountByStudentAndCourse(ctx context.Context, studentID primitive.ObjectID, courseID primitive.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{
		"courseId":  courseID,
		"studentId": studentID,
		"status":    "active",
	})
}

func (r *EnrollmentRepository) Create(ctx context.Context, enrollment models.Enrollment) (*mongo.InsertOneResult, error) {
	return r.collection.InsertOne(ctx, enrollment)
}

func (r *EnrollmentRepository) FindByStudentID(ctx context.Context, studentID primitive.ObjectID) ([]bson.M, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"studentId": studentID}}},
		{{Key: "$sort", Value: bson.M{"enrolledAt": -1}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "courses",
			"localField":   "courseId",
			"foreignField": "_id",
			"as":           "course",
		}}},
		{{Key: "$unwind", Value: "$course"}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "course.teacherId",
			"foreignField": "_id",
			"as":           "course.teacher",
		}}},
		{{Key: "$unwind", Value: "$course.teacher"}},
		{{Key: "$project", Value: bson.M{
			"status":     1,
			"enrolledAt": 1,
			"course": bson.M{
				"_id":         "$course._id",
				"title":       "$course.title",
				"code":        "$course.code",
				"description": "$course.description",
				"status":      "$course.status",
				"teacher": bson.M{
					"username": "$course.teacher.username",
					"email":    "$course.teacher.email",
				},
			},
		}}},
	}
	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var enrollments []bson.M
	if err = cursor.All(ctx, &enrollments); err != nil {
		return nil, err
	}
	return enrollments, nil
}

func (r *EnrollmentRepository) FindAll(ctx context.Context) ([]bson.M, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$sort", Value: bson.M{"enrolledAt": -1}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "studentId",
			"foreignField": "_id",
			"as":           "student",
		}}},
		{{Key: "$unwind", Value: "$student"}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "courses",
			"localField":   "courseId",
			"foreignField": "_id",
			"as":           "course",
		}}},
		{{Key: "$unwind", Value: "$course"}},
		{{Key: "$project", Value: bson.M{
			"status":     1,
			"enrolledAt": 1,
			"student": bson.M{
				"username": "$student.username",
				"email":    "$student.email",
			},
			"course": bson.M{
				"title":  "$course.title",
				"code":   "$course.code",
				"status": "$course.status",
			},
		}}},
	}
	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var enrollments []bson.M
	if err = cursor.All(ctx, &enrollments); err != nil {
		return nil, err
	}
	return enrollments, nil
}

func (r *EnrollmentRepository) Delete(ctx context.Context, courseID primitive.ObjectID, studentID primitive.ObjectID) (*mongo.DeleteResult, error) {
	return r.collection.DeleteOne(ctx, bson.M{"courseId": courseID, "studentId": studentID})
}
