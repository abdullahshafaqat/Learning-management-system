package assignment

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

type AssignmentRepository struct {
	assignments *mongo.Collection
	submissions *mongo.Collection
}

func NewAssignmentRepository() *AssignmentRepository {
	return &AssignmentRepository{
		assignments: connection.GetCollection("assignments"),
		submissions: connection.GetCollection("assignment_submissions"),
	}
}

func (r *AssignmentRepository) CreateAssignment(ctx context.Context, assignment models.Assignment) (*mongo.InsertOneResult, error) {
	return r.assignments.InsertOne(ctx, assignment)
}

func (r *AssignmentRepository) FindAssignmentsByLectureID(ctx context.Context, lectureID primitive.ObjectID) ([]models.Assignment, error) {
	cursor, err := r.assignments.Find(ctx, bson.M{"lectureId": lectureID}, options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []models.Assignment
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *AssignmentRepository) FindAssignmentsByCourseID(ctx context.Context, courseID primitive.ObjectID) ([]models.Assignment, error) {
	cursor, err := r.assignments.Find(ctx, bson.M{"courseId": courseID}, options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []models.Assignment
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *AssignmentRepository) FindAssignmentByID(ctx context.Context, assignmentID primitive.ObjectID) (*models.Assignment, error) {
	var assignment models.Assignment
	if err := r.assignments.FindOne(ctx, bson.M{"_id": assignmentID}).Decode(&assignment); err != nil {
		return nil, err
	}
	return &assignment, nil
}

func (r *AssignmentRepository) CreateSubmission(ctx context.Context, submission models.AssignmentSubmission) (*mongo.InsertOneResult, error) {
	return r.submissions.InsertOne(ctx, submission)
}

func (r *AssignmentRepository) FindSubmissionByAssignmentAndStudent(ctx context.Context, assignmentID, studentID primitive.ObjectID) (*models.AssignmentSubmission, error) {
	var submission models.AssignmentSubmission
	if err := r.submissions.FindOne(ctx, bson.M{"assignmentId": assignmentID, "studentId": studentID}).Decode(&submission); err != nil {
		return nil, err
	}
	return &submission, nil
}

func (r *AssignmentRepository) FindSubmissionByID(ctx context.Context, submissionID primitive.ObjectID) (*models.AssignmentSubmission, error) {
	var submission models.AssignmentSubmission
	if err := r.submissions.FindOne(ctx, bson.M{"_id": submissionID}).Decode(&submission); err != nil {
		return nil, err
	}
	return &submission, nil
}

func (r *AssignmentRepository) UpdateSubmission(ctx context.Context, submissionID primitive.ObjectID, update bson.M) (*mongo.UpdateResult, error) {
	_ = time.Now()
	return r.submissions.UpdateOne(
		ctx,
		bson.M{"_id": submissionID},
		bson.M{"$set": update},
	)
}

func (r *AssignmentRepository) CountByCourseID(ctx context.Context, courseID primitive.ObjectID) (int64, error) {
	return r.assignments.CountDocuments(ctx, bson.M{"courseId": courseID})
}

func (r *AssignmentRepository) UpdateSubmissionGrade(ctx context.Context, submissionID primitive.ObjectID, marks float64, feedback string, gradedBy primitive.ObjectID) (*mongo.UpdateResult, error) {
	now := time.Now()
	return r.submissions.UpdateOne(
		ctx,
		bson.M{"_id": submissionID},
		bson.M{
			"$set": bson.M{
				"marks":    marks,
				"feedback": feedback,
				"gradedAt": now,
				"gradedBy": gradedBy,
			},
		},
	)
}

func (r *AssignmentRepository) FindSubmissionsByAssignment(ctx context.Context, assignmentID primitive.ObjectID) ([]bson.M, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"assignmentId": assignmentID}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "users",
			"localField":   "studentId",
			"foreignField": "_id",
			"as":           "student",
		}}},
		{{Key: "$unwind", Value: bson.M{
			"path":                       "$student",
			"preserveNullAndEmptyArrays": true,
		}}},
		{{Key: "$project", Value: bson.M{
			"_id":          0,
			"id":           bson.M{"$toString": "$_id"},
			"assignmentId": bson.M{"$toString": "$assignmentId"},
			"studentId":    bson.M{"$toString": "$studentId"},
			"studentName":  "$student.username",
			"studentEmail": "$student.email",
			"text":         1,
			"fileUrl":      1,
			"fileName":     1,
			"submittedAt":  1,
			"marks":        1,
			"feedback":     1,
			"gradedAt":     1,
			"status":       1,
		}}},
	}

	cursor, err := r.submissions.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []bson.M
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *AssignmentRepository) FindStudentAssignments(ctx context.Context, studentID primitive.ObjectID) ([]bson.M, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$lookup", Value: bson.M{
			"from":         "courses",
			"localField":   "courseId",
			"foreignField": "_id",
			"as":           "course",
		}}},
		{{Key: "$unwind", Value: bson.M{
			"path":                       "$course",
			"preserveNullAndEmptyArrays": true,
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from": "enrollments",
			"let":  bson.M{"courseId": "$courseId"},
			"pipeline": mongo.Pipeline{
				{{Key: "$match", Value: bson.M{
					"$expr": bson.M{
						"$and": []any{
							bson.M{"$eq": []any{"$courseId", "$$courseId"}},
							bson.M{"$eq": []any{"$studentId", studentID}},
						},
					},
				}}},
			},
			"as": "enrollment",
		}}},
		{{Key: "$match", Value: bson.M{"enrollment.0": bson.M{"$exists": true}}}},
		{{Key: "$lookup", Value: bson.M{
			"from": "assignment_submissions",
			"let":  bson.M{"assignmentId": "$_id"},
			"pipeline": mongo.Pipeline{
				{{Key: "$match", Value: bson.M{
					"$expr": bson.M{
						"$and": []any{
							bson.M{"$eq": []any{"$assignmentId", "$$assignmentId"}},
							bson.M{"$eq": []any{"$studentId", studentID}},
						},
					},
				}}},
				{{Key: "$limit", Value: 1}},
			},
			"as": "mySubmission",
		}}},
		{{Key: "$project", Value: bson.M{
			"_id":            0,
			"id":             bson.M{"$toString": "$_id"},
			"title":          1,
			"description":    1,
			"instructions":   1,
			"attachmentUrl":  1,
			"attachmentName": 1,
			"courseId":       bson.M{"$toString": "$courseId"},
			"lectureId": bson.M{
				"$cond": []any{
					bson.M{"$ifNull": []any{"$lectureId", false}},
					bson.M{"$toString": "$lectureId"},
					nil,
				},
			},
			"courseTitle":  "$course.title",
			"dueDate":      1,
			"maxMarks":     1,
			"createdAt":    1,
			"mySubmission": bson.M{"$arrayElemAt": []any{"$mySubmission", 0}},
		}}},
		{{Key: "$sort", Value: bson.M{"dueDate": 1}}},
	}

	cursor, err := r.assignments.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []bson.M
	if err := cursor.All(ctx, &items); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *AssignmentRepository) InitIndexes(ctx context.Context) error {
	_, err := r.assignments.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "courseId", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "lectureId", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "dueDate", Value: 1}},
		},
	})
	if err != nil {
		return err
	}

	_, err = r.submissions.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "assignmentId", Value: 1}, {Key: "studentId", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "studentId", Value: 1}},
		},
	})
	return err
}
