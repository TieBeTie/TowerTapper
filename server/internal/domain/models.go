package domain

import "time"

// Player представляет игрока
type Player struct {
	ID               int64     `json:"id"`
	TelegramID       int64     `json:"telegram_id"`
	Username         string    `json:"username"`
	Emblems          int64     `json:"emblems"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	MaxWaveCompleted int       `json:"max_wave_completed"`
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

// Payment представляет запись о платеже
type Payment struct {
	ID          int64      `json:"id"`
	PlayerID    int64      `json:"player_id"`
	Amount      int64      `json:"amount"`
	EmblemsQty  int64      `json:"emblems_qty"`
	Status      string     `json:"status"`
	InvoiceURL  string     `json:"invoice_url"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

// CreatePaymentRequest представляет запрос на создание платежа
type CreatePaymentRequest struct {
	PlayerID   int64 `json:"player_id"`
	Amount     int64 `json:"amount"`
	EmblemsQty int64 `json:"emblems_qty"`
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

	// Payment methods
	CreatePayment(payment *Payment) error
	UpdatePayment(payment *Payment) error
	GetPaymentByID(id int64) (*Payment, error)

	// Рейтинг
	GetTopPlayersByMaxWave(limit int) ([]*Player, error)
	GetPlayerRankByMaxWave(telegramID int64) (int, error)
}

// PaymentService определяет методы для работы с платежами
type PaymentService interface {
	CreateInvoice(req *CreatePaymentRequest) (*Payment, error)
	ProcessPayment(paymentID int64, status string) error
}
