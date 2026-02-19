package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Progress struct {
	ID                primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	StudentID         primitive.ObjectID   `bson:"studentId" json:"studentId"`
	CourseID          primitive.ObjectID   `bson:"courseId" json:"courseId"`
	LecturesCompleted []primitive.ObjectID `bson:"lecturesCompleted" json:"lecturesCompleted"`
	QuizzesCompleted  []primitive.ObjectID `bson:"quizzesCompleted" json:"quizzesCompleted"`
	Percentage        float64              `bson:"percentage" json:"percentage"`
	UpdatedAt         time.Time            `bson:"updatedAt" json:"updatedAt"`
}
