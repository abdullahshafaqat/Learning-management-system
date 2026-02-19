package quiz

import (
	"context"

	connection "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/connection"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type QuizRepository struct {
	quizCollection       *mongo.Collection
	submissionCollection *mongo.Collection
}

func NewQuizRepository() *QuizRepository {
	return &QuizRepository{
		quizCollection:       connection.GetCollection("quizzes"),
		submissionCollection: connection.GetCollection("submissions"),
	}
}

// --- Quiz Operations ---

func (r *QuizRepository) CreateQuiz(ctx context.Context, quiz models.Quiz) (*mongo.InsertOneResult, error) {
	return r.quizCollection.InsertOne(ctx, quiz)
}

func (r *QuizRepository) GetQuiz(ctx context.Context, quizID primitive.ObjectID) (*models.Quiz, error) {
	var quiz models.Quiz
	err := r.quizCollection.FindOne(ctx, bson.M{"_id": quizID}).Decode(&quiz)
	if err != nil {
		return nil, err
	}
	return &quiz, nil
}

func (r *QuizRepository) GetQuizByLectureID(ctx context.Context, lectureID primitive.ObjectID) (*models.Quiz, error) {
	// Assuming one quiz per lecture for now, or returns the first one
	var quiz models.Quiz
	err := r.quizCollection.FindOne(ctx, bson.M{"lectureId": lectureID}).Decode(&quiz)
	if err != nil {
		return nil, err
	}
	return &quiz, nil
}

// --- Submission Operations ---

func (r *QuizRepository) CreateSubmission(ctx context.Context, submission models.Submission) (*mongo.InsertOneResult, error) {
	return r.submissionCollection.InsertOne(ctx, submission)
}

func (r *QuizRepository) GetSubmission(ctx context.Context, quizID, studentID primitive.ObjectID) (*models.Submission, error) {
	var submission models.Submission
	err := r.submissionCollection.FindOne(ctx, bson.M{"quizId": quizID, "studentId": studentID}).Decode(&submission)
	if err != nil {
		return nil, err
	}
	return &submission, nil
}

func (r *QuizRepository) GetResults(ctx context.Context, quizID primitive.ObjectID) ([]models.Submission, error) {
	cursor, err := r.submissionCollection.Find(ctx, bson.M{"quizId": quizID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var submissions []models.Submission
	if err = cursor.All(ctx, &submissions); err != nil {
		return nil, err
	}
	return submissions, nil
}

func (r *QuizRepository) InitIndexes(ctx context.Context) error {
	// Quizzes Index: lectureId
	_, err := r.quizCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.M{"lectureId": 1},
	})
	if err != nil {
		return err
	}

	// Submissions Index: quizId + studentId (Partial compound index for uniqueness check if not unique)
	// Actually, a simple quizId index is good for GetResults, and studentId for user history.
	_, err = r.submissionCollection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.M{"quizId": 1}},
		{Keys: bson.M{"studentId": 1}},
		{
			Keys:    bson.D{{Key: "quizId", Value: 1}, {Key: "studentId", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	})
	return err
}
func (r *QuizRepository) CountByLectureIDs(ctx context.Context, lectureIDs []primitive.ObjectID) (int64, error) {
	return r.quizCollection.CountDocuments(ctx, bson.M{"lectureId": bson.M{"$in": lectureIDs}})
}
