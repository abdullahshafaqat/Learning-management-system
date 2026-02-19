package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Question struct {
	Question string   `json:"question" bson:"question"`
	Options  []string `json:"options" bson:"options"`
	Correct  int      `json:"correct" bson:"correct"` // index
}

type Quiz struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	LectureID primitive.ObjectID `json:"lectureId" bson:"lectureId"`
	Title     string             `json:"title" bson:"title"`
	Questions []Question         `json:"questions" bson:"questions"`
	CreatedBy primitive.ObjectID `json:"createdBy" bson:"createdBy"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
}

type Submission struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	QuizID    primitive.ObjectID `json:"quizId" bson:"quizId"`
	StudentID primitive.ObjectID `json:"studentId" bson:"studentId"`
	Answers   []int              `json:"answers" bson:"answers"`
	Score     int                `json:"score" bson:"score"`
	Submitted time.Time          `json:"submittedAt" bson:"submittedAt"`
}
