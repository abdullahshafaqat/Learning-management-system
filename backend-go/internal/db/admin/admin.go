package admin

import (
	"context"

	connection "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/connection"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AdminRepository struct {
	collection *mongo.Collection
}

func NewAdminRepository() *AdminRepository {
	return &AdminRepository{
		collection: connection.GetCollection("users"),
	}
}

func (r *AdminRepository) FindAll(ctx context.Context, roleFilter string) ([]models.User, error) {
	filter := bson.M{}
	if roleFilter != "" {
		filter["role"] = roleFilter
	}
	opts := options.Find().SetProjection(bson.M{"password": 0})
	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err = cursor.All(ctx, &users); err != nil {
		return nil, err
	}
	return users, nil
}

func (r *AdminRepository) FindByID(ctx context.Context, userID primitive.ObjectID) (*models.User, error) {
	var user models.User
	err := r.collection.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *AdminRepository) UpdateRole(ctx context.Context, userID primitive.ObjectID, newRole string) (*models.User, error) {
	update := bson.M{"$set": bson.M{"role": newRole}}
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After).SetProjection(bson.M{"password": 0})
	var updatedUser models.User
	err := r.collection.FindOneAndUpdate(ctx, bson.M{"_id": userID}, update, opts).Decode(&updatedUser)
	if err != nil {
		return nil, err
	}
	return &updatedUser, nil
}

func (r *AdminRepository) UpdateBlockStatus(ctx context.Context, userID primitive.ObjectID, isBlocked bool) (*models.User, error) {
	update := bson.M{"$set": bson.M{"isBlocked": isBlocked}}
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After).SetProjection(bson.M{"password": 0})
	var updatedUser models.User
	err := r.collection.FindOneAndUpdate(ctx, bson.M{"_id": userID}, update, opts).Decode(&updatedUser)
	if err != nil {
		return nil, err
	}
	return &updatedUser, nil
}
