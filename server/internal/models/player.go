package models

type Player struct {
	ID         string    `json:"id"`
	TelegramID int64     `json:"telegram_id"`
	Resources  Resources `json:"resources"`
	Tower      Tower     `json:"tower"`
}

type Resources struct {
	Coins int64 `json:"coins"`
}

type Tower struct {
	Level       int `json:"level"`
	Health      int `json:"health"`
	ArrowDamage int `json:"arrow_damage"`
}
