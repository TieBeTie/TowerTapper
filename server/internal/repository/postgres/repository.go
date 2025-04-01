package postgres

import (
	"database/sql"
	"time"

	"github.com/tiebetie/TowerTapper/internal/domain"
)

type postgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(db *sql.DB) domain.Repository {
	return &postgresRepository{db: db}
}

// Player methods
func (r *postgresRepository) CreatePlayer(player *domain.Player) error {
	query := `
        INSERT INTO players (telegram_id, username, gold, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`

	now := time.Now()
	player.CreatedAt = now
	player.UpdatedAt = now

	return r.db.QueryRow(
		query,
		player.TelegramID,
		player.Username,
		player.Gold,
		player.CreatedAt,
		player.UpdatedAt,
	).Scan(&player.ID)
}

func (r *postgresRepository) GetPlayerByTelegramID(telegramID int64) (*domain.Player, error) {
	player := &domain.Player{}
	query := `
        SELECT id, telegram_id, username, gold, created_at, updated_at
        FROM players
        WHERE telegram_id = $1`

	err := r.db.QueryRow(query, telegramID).Scan(
		&player.ID,
		&player.TelegramID,
		&player.Username,
		&player.Gold,
		&player.CreatedAt,
		&player.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return player, err
}

func (r *postgresRepository) UpdatePlayer(player *domain.Player) error {
	query := `
        UPDATE players
        SET username = $1, gold = $2, updated_at = $3
        WHERE id = $4`

	player.UpdatedAt = time.Now()

	_, err := r.db.Exec(
		query,
		player.Username,
		player.Gold,
		player.UpdatedAt,
		player.ID,
	)
	return err
}

// Castle methods
func (r *postgresRepository) CreateCastle(castle *domain.Castle) error {
	query := `
        INSERT INTO castles (player_id, level, health, arrow_speed, arrow_damage)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`

	return r.db.QueryRow(
		query,
		castle.PlayerID,
		castle.Level,
		castle.Health,
		castle.ArrowSpeed,
		castle.ArrowDamage,
	).Scan(&castle.ID)
}

func (r *postgresRepository) GetCastleByPlayerID(playerID int64) (*domain.Castle, error) {
	castle := &domain.Castle{}
	query := `
        SELECT id, player_id, level, health, arrow_speed, arrow_damage
        FROM castles
        WHERE player_id = $1`

	err := r.db.QueryRow(query, playerID).Scan(
		&castle.ID,
		&castle.PlayerID,
		&castle.Level,
		&castle.Health,
		&castle.ArrowSpeed,
		&castle.ArrowDamage,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return castle, err
}

func (r *postgresRepository) UpdateCastle(castle *domain.Castle) error {
	query := `
        UPDATE castles
        SET level = $1, health = $2, arrow_speed = $3, arrow_damage = $4
        WHERE id = $5`

	_, err := r.db.Exec(
		query,
		castle.Level,
		castle.Health,
		castle.ArrowSpeed,
		castle.ArrowDamage,
		castle.ID,
	)
	return err
}
