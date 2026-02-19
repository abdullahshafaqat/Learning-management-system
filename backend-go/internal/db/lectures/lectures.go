package lecture

import (
	"context"

	connection "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/connection"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type LectureRepository struct {
	collection *mongo.Collection
}

func NewLectureRepository() *LectureRepository {
	return &LectureRepository{
		collection: connection.GetCollection("lectures"),
	}
}

func (r *LectureRepository) FindLastLecture(ctx context.Context, courseID primitive.ObjectID) (*models.Lecture, error) {
	opts := options.FindOne().SetSort(bson.D{{Key: "order", Value: -1}})
	var lastLecture models.Lecture
	err := r.collection.FindOne(ctx, bson.M{"courseId": courseID}, opts).Decode(&lastLecture)
	if err != nil {
		return nil, err
	}
	return &lastLecture, nil
}

func (r *LectureRepository) Create(ctx context.Context, lecture models.Lecture) (*mongo.InsertOneResult, error) {
	return r.collection.InsertOne(ctx, lecture)
}

func (r *LectureRepository) FindByCourseID(ctx context.Context, courseID primitive.ObjectID, filter bson.M, page, limit int) ([]models.Lecture, int64, error) {
	if filter == nil {
		filter = bson.M{}
	}
	filter["courseId"] = courseID

	// 1. Count Total
	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// 2. Find with Skip/Limit
	skip := (page - 1) * limit
	opts := options.Find().
		SetSort(bson.D{{Key: "order", Value: 1}}).
		SetSkip(int64(skip)).
		SetLimit(int64(limit))

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var lectures []models.Lecture
	if err = cursor.All(ctx, &lectures); err != nil {
		return nil, 0, err
	}
	return lectures, total, nil
}

func (r *LectureRepository) FindOne(ctx context.Context, lectureID primitive.ObjectID) (*models.Lecture, error) {
	var lecture models.Lecture
	err := r.collection.FindOne(ctx, bson.M{"_id": lectureID}).Decode(&lecture)
	if err != nil {
		return nil, err
	}
	return &lecture, nil
}

func (r *LectureRepository) UpdateOne(ctx context.Context, lectureID primitive.ObjectID, updates bson.M) (*mongo.UpdateResult, error) {
	return r.collection.UpdateOne(ctx, bson.M{"_id": lectureID}, bson.M{"$set": updates})
}

func (r *LectureRepository) DeleteOne(ctx context.Context, lectureID primitive.ObjectID) (*mongo.DeleteResult, error) {
	return r.collection.DeleteOne(ctx, bson.M{"_id": lectureID})
}

func (r *LectureRepository) BulkWrite(ctx context.Context, models []mongo.WriteModel) (*mongo.BulkWriteResult, error) {
	return r.collection.BulkWrite(ctx, models)
}

func (r *LectureRepository) CountByCourseID(ctx context.Context, courseID primitive.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{"courseId": courseID})
}

func (r *LectureRepository) FindAllByCourseID(ctx context.Context, courseID primitive.ObjectID) ([]models.Lecture, error) {
	cursor, err := r.collection.Find(ctx, bson.M{"courseId": courseID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var lectures []models.Lecture
	if err = cursor.All(ctx, &lectures); err != nil {
		return nil, err
	}
	return lectures, nil
}
