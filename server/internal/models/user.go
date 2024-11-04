package models

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Password  string    `json:"-"` // Exclude password from JSON responses
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
