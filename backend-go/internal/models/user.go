package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username           string             `bson:"username" json:"username" binding:"required"`
	Email              string             `bson:"email" json:"email" binding:"required,email"`
	Password           string             `bson:"password" json:"-" binding:"required"`
	Role               string             `bson:"role" json:"role" binding:"omitempty,oneof=student teacher admin"`
	IsBlocked          bool               `bson:"isBlocked" json:"isBlocked"`
	RefreshToken       string             `bson:"refreshToken,omitempty" json:"-"`
	RefreshTokenExpiry time.Time          `bson:"refreshTokenExpiry,omitempty" json:"-"`
	ResetToken         string             `bson:"resetToken,omitempty" json:"-"`
	ResetTokenExpiry   time.Time          `bson:"resetTokenExpiry,omitempty" json:"-"`
	CreatedAt          time.Time          `bson:"createdAt" json:"createdAt"`
}
