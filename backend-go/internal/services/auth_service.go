package services

import (
	"context"
	"errors"
	"time"

	authRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/auth"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/utils"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AuthService struct {
	repo *authRepo.AuthRepository
}

func NewAuthService() *AuthService {
	return &AuthService{
		repo: authRepo.NewAuthRepository(),
	}
}

func (s *AuthService) Register(username, email, password, role string) (string, string, *models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Check if user exists
	count, err := s.repo.FindUserByEmailOrUsername(ctx, email, username)
	if err != nil {
		return "", "", nil, err
	}
	if count > 0 {
		return "", "", nil, errors.New("user already exists")
	}

	// Helper to check role
	allowedRoles := map[string]bool{"student": true, "teacher": true, "admin": true}
	safeRole := "student"
	if allowedRoles[role] {
		safeRole = role
	}

	// Singleton Admin Check
	if safeRole == "admin" {
		adminCount, err := s.repo.FindAdmin(ctx)
		if err != nil {
			return "", "", nil, err
		}
		if adminCount > 0 {
			safeRole = "student"
		}
	}

	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return "", "", nil, err
	}

	newUser := models.User{
		ID:        primitive.NewObjectID(),
		Username:  username,
		Email:     email,
		Password:  hashedPassword,
		Role:      safeRole,
		IsBlocked: false,
		CreatedAt: time.Now(),
	}

	_, err = s.repo.CreateUser(ctx, newUser)
	if err != nil {
		return "", "", nil, err
	}

	accessToken, refreshToken, err := utils.GenerateTokens(newUser.ID, newUser.Role)
	if err != nil {
		return "", "", nil, err
	}

	// Store refresh token
	err = s.repo.UpdateRefreshToken(ctx, newUser.ID, refreshToken, time.Now().Add(7*24*time.Hour))
	if err != nil {
		return "", "", nil, err
	}

	return accessToken, refreshToken, &newUser, nil
}

func (s *AuthService) Login(email, password string) (string, string, *models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	user, err := s.repo.FindUserByEmail(ctx, email)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return "", "", nil, errors.New("invalid credentials")
		}
		return "", "", nil, err
	}

	if !utils.ComparePassword(password, user.Password) {
		return "", "", nil, errors.New("invalid credentials")
	}

	if user.IsBlocked {
		return "", "", nil, errors.New("your account has been blocked")
	}

	accessToken, refreshToken, err := utils.GenerateTokens(user.ID, user.Role)
	if err != nil {
		return "", "", nil, err
	}

	// Store refresh token
	err = s.repo.UpdateRefreshToken(ctx, user.ID, refreshToken, time.Now().Add(7*24*time.Hour))
	if err != nil {
		return "", "", nil, err
	}

	return accessToken, refreshToken, user, nil
}

func (s *AuthService) RotateTokens(oldRefreshToken string) (string, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	claims, err := utils.ValidateRefreshToken(oldRefreshToken)
	if err != nil {
		return "", "", errors.New("invalid refresh token")
	}

	// Check DB
	user, err := s.repo.FindUserByRefreshToken(ctx, oldRefreshToken)
	if err != nil {
		return "", "", errors.New("invalid refresh token")
	}

	// Check Expiry
	if time.Now().After(user.RefreshTokenExpiry) {
		return "", "", errors.New("refresh token expired")
	}

	// Check if user is blocked
	if user.IsBlocked {
		return "", "", errors.New("your account has been blocked")
	}

	// Prevent token reuse hijacking? (If ID matches but token is different? No FindUserByRefreshToken handles that)

	// User ID from claims must match user ID from DB found by token?
	if user.ID.Hex() != claims.ID {
		return "", "", errors.New("user mismatch")
	}

	newAccess, newRefresh, err := utils.GenerateTokens(user.ID, user.Role)
	if err != nil {
		return "", "", err
	}

	err = s.repo.UpdateRefreshToken(ctx, user.ID, newRefresh, time.Now().Add(7*24*time.Hour))
	if err != nil {
		return "", "", err
	}

	return newAccess, newRefresh, nil
}

func (s *AuthService) Logout(userID primitive.ObjectID) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return s.repo.ClearRefreshToken(ctx, userID)
}
