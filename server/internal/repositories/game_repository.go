package repositories

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/tiebetie/TowerTapper/internal/models"
	"github.com/tiebetie/TowerTapper/pkg/database"
)

// GameRepository handles game-related data operations
type GameRepository struct {
	// Add fields for database connection if using dependency injection
}

// NewGameRepository creates a new instance of GameRepository
func NewGameRepository() *GameRepository {
	return &GameRepository{}
}

// GetGameState retrieves the current game state from the database with context timeout
func (repo *GameRepository) GetGameState(gameID int) (*models.GameState, error) {
	query := "SELECT state FROM game_state WHERE id = $1"
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	row := database.DB.QueryRowContext(ctx, query, gameID)
	gameState := &models.GameState{}
	err := row.Scan(&gameState.State)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("game state not found")
		}
		return nil, err
	}
	return gameState, nil
}

// UpdateGameState updates the game state in the database with context timeout
func (repo *GameRepository) UpdateGameState(gameID int, state string) error {
	if state == "" {
		return errors.New("state cannot be empty")
	}
	query := "UPDATE game_state SET state = $1 WHERE id = $2"
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := database.DB.ExecContext(ctx, query, state, gameID)
	if err != nil {
		return err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return errors.New("no game state updated")
	}
	return nil
}
