package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Course struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title       string             `bson:"title" json:"title" binding:"required"`
	Code        string             `bson:"code" json:"code" binding:"required"`
	Description string             `bson:"description" json:"description" binding:"required"`
	TeacherID   primitive.ObjectID `bson:"teacherId" json:"teacherId"`
	Status      string             `bson:"status" json:"status" binding:"omitempty,oneof=published draft archived"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
}
