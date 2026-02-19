package services

import (
	"context"
	"errors"
	"time"

	adminRepo "github.com/abdullahshafaqat/Learning-management-system.git/internal/db/admin"
	"github.com/abdullahshafaqat/Learning-management-system.git/internal/models"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AdminService struct {
	repo *adminRepo.AdminRepository
}

func NewAdminService() *AdminService {
	return &AdminService{
		repo: adminRepo.NewAdminRepository(),
	}
}

func (s *AdminService) GetAllUsers(roleFilter string) ([]models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return s.repo.FindAll(ctx, roleFilter)
}

func (s *AdminService) UpdateUserRole(userIDHex string, newRole string) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if newRole == "admin" {
		return nil, errors.New("cannot promote to admin via this endpoint")
	}
	if newRole != "student" && newRole != "teacher" {
		return nil, errors.New("invalid role. Allowed: student, teacher")
	}

	userID, err := primitive.ObjectIDFromHex(userIDHex)
	if err != nil {
		return nil, errors.New("invalid user ID format")
	}

	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.Role == "admin" {
		return nil, errors.New("cannot change role of an admin user")
	}

	return s.repo.UpdateRole(ctx, userID, newRole)
}

func (s *AdminService) ToggleUserBlock(userIDHex string, isBlocked bool) (*models.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userID, err := primitive.ObjectIDFromHex(userIDHex)
	if err != nil {
		return nil, errors.New("invalid user ID format")
	}

	user, err := s.repo.FindByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.Role == "admin" {
		return nil, errors.New("cannot block an admin")
	}

	return s.repo.UpdateBlockStatus(ctx, userID, isBlocked)
}
