package domain

import "time"

// Player представляет игрока
type Player struct {
	ID         int64     `json:"id"`
	TelegramID int64     `json:"telegram_id"`
	Username   string    `json:"username"`
	Gold       int64     `json:"gold"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// Castle представляет замок игрока
type Castle struct {
	ID          int64   `json:"id"`
	PlayerID    int64   `json:"player_id"`
	Level       int     `json:"level"`
	Health      int     `json:"health"`
	ArrowSpeed  float64 `json:"arrow_speed"`
	ArrowDamage int     `json:"arrow_damage"`
}

// Repository интерфейс определяет методы для работы с хранилищем
type Repository interface {
	// Player methods
	CreatePlayer(player *Player) error
	GetPlayerByTelegramID(telegramID int64) (*Player, error)
	UpdatePlayer(player *Player) error

	// Castle methods
	CreateCastle(castle *Castle) error
	GetCastleByPlayerID(playerID int64) (*Castle, error)
	UpdateCastle(castle *Castle) error
}
