package models

// GameMessage represents messages exchanged between the client and server via WebSocket
type GameMessage struct {
	GameID   int    `json:"game_id"`
	NewState string `json:"new_state"`
}
