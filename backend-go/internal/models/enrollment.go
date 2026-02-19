package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Enrollment struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	StudentID  primitive.ObjectID `bson:"studentId" json:"studentId"`
	CourseID   primitive.ObjectID `bson:"courseId" json:"courseId"`
	Status     string             `bson:"status" json:"status" binding:"omitempty,oneof=active completed dropped"`
	EnrolledAt time.Time          `bson:"enrolledAt" json:"enrolledAt"`
}
