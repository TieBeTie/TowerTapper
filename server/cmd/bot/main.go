package main

import (
	"log"
	"net/http"
	"os"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/joho/godotenv"
	"github.com/tiebetie/TowerTapper/internal/delivery/websocket"
	"github.com/tiebetie/TowerTapper/internal/repository/postgres"
	"github.com/tiebetie/TowerTapper/internal/usecase"
)

// InvoiceRequest represents a request to create an invoice
type InvoiceRequest struct {
	UserID       int64 `json:"user_id"`
	EmblemAmount int   `json:"emblem_amount"`
	StarCost     int   `json:"star_cost"`
}

// InvoiceResponse represents a response with created invoice
type InvoiceResponse struct {
	InvoiceLink string `json:"invoice_link"`
}

// RefundRequest represents a request to refund a payment
type RefundRequest struct {
	PaymentID    string `json:"payment_id"`
	UserID       int64  `json:"user_id"`
	RefundAmount int    `json:"refund_amount"`
	RefundReason string `json:"refund_reason"`
}

// RefundResponse represents a response to a refund request
type RefundResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

func main() {
	log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds | log.Lshortfile)

	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	var playerUseCase *usecase.PlayerUseCase
	var bot *tgbotapi.BotAPI
	var wsHandlerFunc http.HandlerFunc

	if os.Getenv("TEST_MODE") == "true" {
		log.Println("Running in test mode without database")
		playerUseCase = usecase.NewMockPlayerUseCase()
	} else {
		db, err := InitDB()
		if err != nil {
			log.Panic(err)
		}
		defer db.Close()
		playerUseCase = usecase.NewPlayerUseCase(postgres.NewPostgresRepository(db))
	}

	bot, err := InitBot()
	if err != nil {
		log.Panic(err)
	}

	wsHandler := websocket.NewHandler(playerUseCase)
	wsHandlerFunc = wsHandler.HandleWebSocket

	mux := http.NewServeMux()
	RegisterAllHandlers(mux, playerUseCase, bot, wsHandlerFunc)

	serverPort := os.Getenv("SERVER_PORT")
	if serverPort == "" {
		serverPort = "8080"
	}
	addr := "0.0.0.0:" + serverPort
	log.Printf("Starting server on %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}
