package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Lecture struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CourseID    primitive.ObjectID `bson:"courseId" json:"courseId"`
	Title       string             `bson:"title" json:"title" binding:"required"`
	MediaType   string             `bson:"mediaType" json:"mediaType" binding:"required,oneof=video audio document image"`
	FileURL     string             `bson:"fileUrl" json:"fileUrl"`
	PublicID    string             `bson:"publicId" json:"publicId" binding:"required"`
	FileName    string             `bson:"fileName" json:"fileName"` // Store original filename
	Order       int                `bson:"order" json:"order"`
	IsPublished bool               `bson:"isPublished" json:"isPublished"`
	IsPreview   bool               `bson:"isPreview" json:"isPreview"`
	Duration    float64            `bson:"duration" json:"duration"`
	Size        int64              `bson:"size" json:"size"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
}
