package services

import (
	"errors"
	"log"

	"github.com/tiebetie/TowerTapper/internal/models"
	"github.com/tiebetie/TowerTapper/internal/repositories"
	"golang.org/x/crypto/bcrypt"
)

// UserService provides user-related business logic
type UserService struct {
	userRepo *repositories.UserRepository
}

// NewUserService creates a new instance of UserService
func NewUserService() *UserService {
	return &UserService{
		userRepo: repositories.NewUserRepository(),
	}
}

// GetUser retrieves a user by ID
func (s *UserService) GetUser(userID int) (*models.User, error) {
	return s.userRepo.GetUser(userID)
}

// CreateUser creates a new user with hashed password
func (s *UserService) CreateUser(user *models.User) error {
	// Hash the password before storing
	hashedPassword, err := hashPassword(user.Password)
	if err != nil {
		return err
	}
	user.Password = hashedPassword

	return s.userRepo.CreateUser(user)
}

// CreateUserAndRedirect handles creating a user based on a command
func (s *UserService) CreateUserAndRedirect(command string) error {
	if command != "/start" {
		return errors.New("unsupported command")
	}

	// Example logic: create a new user
	newUser := &models.User{
		Name:     "New User",
		Email:    "new.user@example.com",
		Password: "securepassword", // This will be hashed in CreateUser
	}

	err := s.CreateUser(newUser)
	if err != nil {
		return err
	}

	log.Printf("User created with ID: %d", newUser.ID)
	// Optionally, implement redirection logic here

	return nil
}

// hashPassword hashes the given password using bcrypt
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}
