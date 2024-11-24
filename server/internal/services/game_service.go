package services

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
	"github.com/tiebetie/TowerTapper/internal/models"
	"github.com/tiebetie/TowerTapper/internal/repositories"
)

// GameService provides game-related business logic
type GameService struct {
	gameRepo *repositories.GameRepository
}

// NewGameService creates a new instance of GameService
func NewGameService() *GameService {
	return &GameService{
		gameRepo: repositories.NewGameRepository(),
	}
}

// HandlePlayerConnection manages the player's WebSocket connection
func (s *GameService) HandlePlayerConnection(conn *websocket.Conn) {
	defer conn.Close()
	log.Println("Player connected")

	for {
		// Read message from client
		_, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
		log.Printf("Received message: %s", message)

		// Parse the incoming message
		var msg models.GameMessage
		err = json.Unmarshal(message, &msg)
		if err != nil {
			log.Printf("Error parsing message: %v", err)
			continue
		}

		// Example: Update game state based on message
		err = s.UpdateGameState(msg.GameID, msg.NewState)
		if err != nil {
			log.Printf("Error updating game state: %v", err)
			continue
		}

		// Send acknowledgment back to client
		ack := models.GameMessage{
			GameID:   msg.GameID,
			NewState: "Updated",
		}
		ackBytes, _ := json.Marshal(ack)
		err = conn.WriteMessage(websocket.TextMessage, ackBytes)
		if err != nil {
			log.Printf("Error writing message: %v", err)
			break
		}
	}

	log.Println("Player disconnected")
}

// GetGameState retrieves the current state of the game
func (s *GameService) GetGameState(gameID int) (*models.GameState, error) {
	return s.gameRepo.GetGameState(gameID)
}

// UpdateGameState updates the state of the game
func (s *GameService) UpdateGameState(gameID int, state string) error {
	return s.gameRepo.UpdateGameState(gameID, state)
}
