package repositories

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/tiebetie/TowerTapper/internal/models"
	"github.com/tiebetie/TowerTapper/pkg/database"
)

// UserRepository handles user-related data operations
type UserRepository struct {
	// Add fields for database connection if using dependency injection
}

// NewUserRepository creates a new instance of UserRepository
func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

// GetUser retrieves a user by ID from the database with context timeout
func (repo *UserRepository) GetUser(userID int) (*models.User, error) {
	query := "SELECT id, name, email, password FROM users WHERE id = $1"
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	row := database.DB.QueryRowContext(ctx, query, userID)
	user := &models.User{}
	err := row.Scan(&user.ID, &user.Name, &user.Email, &user.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return user, nil
}

// CreateUser creates a new user in the database with context timeout
func (repo *UserRepository) CreateUser(user *models.User) error {
	query := "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id"
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	err := database.DB.QueryRowContext(ctx, query, user.Name, user.Email, user.Password).Scan(&user.ID)
	if err != nil {
		return err
	}
	return nil
}
