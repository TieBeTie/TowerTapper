package models

import (
	"time"
)

// GameState represents the state of a game
type GameState struct {
	ID        int       `json:"id"`
	State     string    `json:"state"`
	GameID    int       `json:"game_id"`
	UpdatedAt time.Time `json:"updated_at"`
	// Add other game state fields as needed
}
