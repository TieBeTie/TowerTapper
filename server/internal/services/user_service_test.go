package services

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/tiebetie/TowerTapper/internal/models"
	"github.com/tiebetie/TowerTapper/internal/repositories"
)

func TestCreateUser(t *testing.T) {
	userRepo := repositories.NewUserRepository()
	userService := NewUserService()

	user := &models.User{
		Name:     "Test User",
		Email:    "test@example.com",
		Password: "password123",
	}

	err := userService.CreateUser(user)
	assert.NoError(t, err)
	assert.NotZero(t, user.ID)
}
