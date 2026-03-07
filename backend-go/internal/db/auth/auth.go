package auth

import (
	"context"
	"time"

	connection "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/connection"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AuthRepository struct {
	collection *mongo.Collection
}

func NewAuthRepository() *AuthRepository {
	return &AuthRepository{
		collection: connection.GetCollection("users"),
	}
}

func (r *AuthRepository) FindUserByEmailOrUsername(ctx context.Context, email, username string) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{
		"$or": []bson.M{
			{"email": email},
			{"username": username},
		},
	})
}

func (r *AuthRepository) FindAdmin(ctx context.Context) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{"role": "admin"})
}

func (r *AuthRepository) CreateUser(ctx context.Context, user models.User) (*mongo.InsertOneResult, error) {
	return r.collection.InsertOne(ctx, user)
}

func (r *AuthRepository) FindUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *AuthRepository) UpdateRefreshToken(ctx context.Context, userID primitive.ObjectID, refreshToken string, expiry time.Time) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{
		"$set": bson.M{
			"refreshToken":       refreshToken,
			"refreshTokenExpiry": expiry,
		},
	})
	return err
}

func (r *AuthRepository) FindUserByRefreshToken(ctx context.Context, refreshToken string) (*models.User, error) {
	var user models.User
	err := r.collection.FindOne(ctx, bson.M{"refreshToken": refreshToken}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *AuthRepository) FindUserByID(ctx context.Context, userID primitive.ObjectID) (*models.User, error) {
	var user models.User
	err := r.collection.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *AuthRepository) ClearRefreshToken(ctx context.Context, userID primitive.ObjectID) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{
		"$unset": bson.M{
			"refreshToken":       "",
			"refreshTokenExpiry": "",
		},
	})
	return err
}

func (r *AuthRepository) SetResetToken(ctx context.Context, userID primitive.ObjectID, tokenHash string, expiry time.Time) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{
		"$set": bson.M{
			"resetToken":       tokenHash,
			"resetTokenExpiry": expiry,
		},
	})
	return err
}

func (r *AuthRepository) FindUserByResetToken(ctx context.Context, tokenHash string) (*models.User, error) {
	var user models.User
	err := r.collection.FindOne(ctx, bson.M{"resetToken": tokenHash}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *AuthRepository) ClearResetToken(ctx context.Context, userID primitive.ObjectID) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{
		"$unset": bson.M{
			"resetToken":       "",
			"resetTokenExpiry": "",
		},
	})
	return err
}

func (r *AuthRepository) UpdatePasswordAndClearReset(ctx context.Context, userID primitive.ObjectID, hashedPassword string) error {
	_, err := r.collection.UpdateOne(ctx, bson.M{"_id": userID}, bson.M{
		"$set": bson.M{
			"password": hashedPassword,
		},
		"$unset": bson.M{
			"resetToken":       "",
			"resetTokenExpiry": "",
		},
	})
	return err
}
