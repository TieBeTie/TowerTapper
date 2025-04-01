package domain

import "time"

// Player представляет игрока
type Player struct {
	ID         int64     `json:"id"`
	TelegramID int64     `json:"telegram_id"`
	Username   string    `json:"username"`
	Emblems    int64     `json:"emblems"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// PlayerSkill представляет постоянный уровень навыка игрока
type PlayerSkill struct {
	ID        int64     `json:"id"`
	PlayerID  int64     `json:"player_id"`
	SkillType string    `json:"skill_type"`
	Level     int       `json:"level"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Repository интерфейс определяет методы для работы с хранилищем
type Repository interface {
	// Player methods
	CreatePlayer(player *Player) error
	GetPlayerByTelegramID(telegramID int64) (*Player, error)
	UpdatePlayer(player *Player) error

	// Skill methods
	GetPlayerSkills(playerID int64) ([]*PlayerSkill, error)
	SavePlayerSkill(skill *PlayerSkill) error
}
