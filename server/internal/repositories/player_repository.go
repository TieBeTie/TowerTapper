package repositories

import (
	"context"
	"database/sql"

	"github.com/tiebetie/TowerTapper/internal/models"
)

type PlayerRepository struct {
	db *sql.DB
}

func NewPlayerRepository(db *sql.DB) *PlayerRepository {
	return &PlayerRepository{db: db}
}

func (r *PlayerRepository) GetPlayerByTelegramID(ctx context.Context, telegramID int64) (*models.Player, error) {
	query := `
        SELECT id, telegram_id, coins, tower_level, tower_health, tower_arrow_damage 
        FROM players 
        WHERE telegram_id = $1
    `

	var player models.Player
	err := r.db.QueryRowContext(ctx, query, telegramID).Scan(
		&player.ID,
		&player.TelegramID,
		&player.Resources.Coins,
		&player.Tower.Level,
		&player.Tower.Health,
		&player.Tower.ArrowDamage,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &player, nil
}

func (r *PlayerRepository) CreatePlayer(ctx context.Context, player *models.Player) error {
	query := `
        INSERT INTO players (telegram_id, coins, tower_level, tower_health, tower_arrow_damage)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    `

	return r.db.QueryRowContext(ctx, query,
		player.TelegramID,
		player.Resources.Coins,
		player.Tower.Level,
		player.Tower.Health,
		player.Tower.ArrowDamage,
	).Scan(&player.ID)
}
