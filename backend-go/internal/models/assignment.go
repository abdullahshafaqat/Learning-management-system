package models

import (
	"time"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Assignment struct {
	ID             primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	CourseID       primitive.ObjectID  `bson:"courseId" json:"courseId"`
	LectureID      *primitive.ObjectID `bson:"lectureId,omitempty" json:"lectureId,omitempty"`
	Title          string              `bson:"title" json:"title" binding:"required"`
	Description    string              `bson:"description" json:"description" binding:"required"`
	Instructions   string              `bson:"instructions,omitempty" json:"instructions,omitempty"`
	AttachmentURL  string              `bson:"attachmentUrl,omitempty" json:"attachmentUrl,omitempty"`
	AttachmentName string              `bson:"attachmentName,omitempty" json:"attachmentName,omitempty"`
	DueDate        time.Time           `bson:"dueDate" json:"dueDate"`
	MaxMarks       float64             `bson:"maxMarks" json:"maxMarks"`
	CreatedBy      primitive.ObjectID  `bson:"createdBy" json:"createdBy"`
	CreatedAt      time.Time           `bson:"createdAt" json:"createdAt"`
}

type AssignmentSubmission struct {
	ID           primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	AssignmentID primitive.ObjectID  `bson:"assignmentId" json:"assignmentId"`
	StudentID    primitive.ObjectID  `bson:"studentId" json:"studentId"`
	Text         string              `bson:"text,omitempty" json:"text,omitempty"`
	FileURL      string              `bson:"fileUrl,omitempty" json:"fileUrl,omitempty"`
	FileName     string              `bson:"fileName,omitempty" json:"fileName,omitempty"`
	PublicID     string              `bson:"publicId,omitempty" json:"publicId,omitempty"`
	SubmittedAt  time.Time           `bson:"submittedAt" json:"submittedAt"`
	Status       string              `bson:"status" json:"status"`
	Marks        *float64            `bson:"marks,omitempty" json:"marks,omitempty"`
	Feedback     string              `bson:"feedback,omitempty" json:"feedback,omitempty"`
	GradedAt     *time.Time          `bson:"gradedAt,omitempty" json:"gradedAt,omitempty"`
	GradedBy     *primitive.ObjectID `bson:"gradedBy,omitempty" json:"gradedBy,omitempty"`
}
