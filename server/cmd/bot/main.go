package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/joho/godotenv"
	"github.com/tiebetie/TowerTapper/internal/delivery/websocket"
	"github.com/tiebetie/TowerTapper/internal/domain"
	"github.com/tiebetie/TowerTapper/internal/repository/postgres"
	"github.com/tiebetie/TowerTapper/internal/usecase"
	"github.com/tiebetie/TowerTapper/pkg/database"
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

func main() {
	// Configure logging to output to stdout/stderr
	log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds | log.Lshortfile)

	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	var playerUseCase *usecase.PlayerUseCase

	// Check environment variable for test mode
	if os.Getenv("TEST_MODE") == "true" {
		log.Println("Running in test mode without database")
		playerUseCase = usecase.NewMockPlayerUseCase()
	} else {
		// Initialize database
		dbConfig := database.Config{
			Host:     os.Getenv("DB_HOST"),
			Port:     os.Getenv("DB_PORT"),
			User:     os.Getenv("DB_USER"),
			Password: os.Getenv("DB_PASSWORD"),
			DBName:   os.Getenv("DB_NAME"),
		}

		var db *sql.DB
		var err error
		maxRetries := 5
		for i := 0; i < maxRetries; i++ {
			db, err = database.NewPostgresDB(dbConfig)
			if err == nil {
				break
			}
			log.Printf("Failed to connect to database, attempt %d/%d: %v", i+1, maxRetries, err)
			time.Sleep(time.Second * 5)
		}
		if err != nil {
			log.Panic(err)
		}
		defer db.Close()

		// Create tables
		if err := database.CreateTables(db); err != nil {
			log.Panic(err)
		}

		// Initialize repository and use case
		repo := postgres.NewPostgresRepository(db)
		playerUseCase = usecase.NewPlayerUseCase(repo)
	}

	// Initialize Telegram bot
	bot, err := tgbotapi.NewBotAPI(os.Getenv("BOT_TOKEN"))
	if err != nil {
		log.Panic(err)
	}

	bot.Debug = true
	log.Printf("Authorized on account %s", bot.Self.UserName)

	// Webhook configuration (just a simple comment)
	log.Printf("=== DEBUG === To configure the webhook, use Bot API directly with URL: %s", os.Getenv("WEBHOOK_URL"))

	// Initialize WebSocket handler
	wsHandler := websocket.NewHandler(playerUseCase)
	http.HandleFunc("/ws", wsHandler.HandleWebSocket)

	// Handler for creating invoices
	http.HandleFunc("/api/create-invoice", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("=== DEBUG === Received invoice creation request: %s %s", r.Method, r.URL.String())

		if r.Method != http.MethodPost {
			log.Printf("=== ERROR === Invalid request method: %s", r.Method)
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// CORS setup
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Processing OPTIONS request (preflight)
		if r.Method == http.MethodOptions {
			log.Printf("=== DEBUG === Processing preflight OPTIONS request")
			w.WriteHeader(http.StatusOK)
			return
		}

		// Decoding JSON request
		var req InvoiceRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("=== ERROR === Error decoding JSON: %v", err)
			http.Error(w, "Invalid request format", http.StatusBadRequest)
			return
		}

		log.Printf("=== DEBUG === Request data: UserID=%d, EmblemAmount=%d, StarCost=%d",
			req.UserID, req.EmblemAmount, req.StarCost)

		// Data validation
		if req.UserID <= 0 || req.EmblemAmount <= 0 || req.StarCost <= 0 {
			log.Printf("=== ERROR === Invalid request parameters: UserID=%d, EmblemAmount=%d, StarCost=%d",
				req.UserID, req.EmblemAmount, req.StarCost)
			http.Error(w, "Invalid request parameters", http.StatusBadRequest)
			return
		}

		// Creating URL for payment via Deep Link Bot API
		// In a real application, here should be code to create an invoice via Bot API
		// For testing, we use a direct link
		botUsername := bot.Self.UserName
		startParam := fmt.Sprintf("buy_emblems_%d_%d", req.EmblemAmount, req.StarCost)
		invoiceLink := fmt.Sprintf("tg://resolve?domain=%s&start=%s", botUsername, startParam)

		// For logging:
		log.Printf("=== DEBUG === Created payment link: %s", invoiceLink)
		log.Printf("=== DEBUG === User data: UserID=%d, Emblems=%d, Stars=%d",
			req.UserID, req.EmblemAmount, req.StarCost)

		// Sending response
		resp := InvoiceResponse{
			InvoiceLink: invoiceLink,
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			log.Printf("=== ERROR === Error encoding response: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		log.Printf("=== DEBUG === Response successfully sent to client")
	})

	// Handler for webhook from Telegram
	http.HandleFunc("/webhook", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("=== DEBUG === Received webhook from Telegram: %s %s", r.Method, r.URL.String())

		update, err := bot.HandleUpdate(r)
		if err != nil {
			log.Printf("=== ERROR === Error processing webhook: %v", err)
			return
		}

		// Processing /start command
		if update.Message != nil && update.Message.IsCommand() && update.Message.Command() == "start" {
			log.Printf("=== DEBUG === Received /start command from user %s (ID: %d)",
				update.Message.From.UserName, update.Message.From.ID)

			// Check for deep link parameters
			startArgs := update.Message.CommandArguments()

			// If there are parameters (for purchase), process them
			if strings.HasPrefix(startArgs, "buy_emblems_") {
				log.Printf("=== DEBUG === Received parameters for emblem purchase: %s", startArgs)
				// Emblem purchase logic is handled elsewhere
			} else {
				// If no parameters, show statistics
				handleStartCommand(bot, *update, playerUseCase)
			}

			return
		}

		// Processing pre-checkout request
		if update.PreCheckoutQuery != nil {
			log.Printf("=== DEBUG === Received pre-checkout request: ID=%s", update.PreCheckoutQuery.ID)

			preCheckoutConfig := tgbotapi.PreCheckoutConfig{
				PreCheckoutQueryID: update.PreCheckoutQuery.ID,
				OK:                 true,
			}
			if _, err := bot.Request(preCheckoutConfig); err != nil {
				log.Printf("=== ERROR === Error approving pre-checkout request: %v", err)
			} else {
				log.Printf("=== DEBUG === Pre-checkout request successfully approved")
			}
		}

		// Processing successful payment
		if update.Message != nil && update.Message.SuccessfulPayment != nil {
			payment := update.Message.SuccessfulPayment
			payload := payment.InvoicePayload

			log.Printf("=== DEBUG === Received successful payment notification: Payload=%s, TotalAmount=%d",
				payload, payment.TotalAmount)

			// Parsing payload (e.g., "user_123456789_emblems_100")
			// Format: user_{user_id}_emblems_{amount}
			userIDStr := ""
			emblemAmount := 0

			// Simple payload parser
			parts := strings.Split(payload, "_")
			if len(parts) >= 4 && parts[0] == "user" && parts[2] == "emblems" {
				userIDStr = parts[1]
				emblemAmount, _ = strconv.Atoi(parts[3])
				log.Printf("=== DEBUG === Payment data: UserID=%s, EmblemAmount=%d", userIDStr, emblemAmount)
			} else {
				log.Printf("=== ERROR === Invalid payload format: %s", payload)
			}

			if userIDStr != "" && emblemAmount > 0 {
				userID, err := strconv.ParseInt(userIDStr, 10, 64)
				if err != nil {
					log.Printf("=== ERROR === Error parsing user ID: %v", err)
					return
				}

				// Granting emblems to the user
				log.Printf("=== DEBUG === Starting emblem balance update for user %d with %d emblems",
					userID, emblemAmount)

				err = playerUseCase.AddPlayerEmblems(userID, int64(emblemAmount))
				if err != nil {
					log.Printf("=== ERROR === Error updating emblem balance: %v", err)
					return
				}

				log.Printf("=== DEBUG === Emblem balance successfully updated")

				// Getting updated player data for the message
				updatedPlayer, err := playerUseCase.GetPlayerData(userID)
				if err != nil {
					log.Printf("=== ERROR === Error getting player data: %v", err)
					return
				}

				log.Printf("=== DEBUG === Updated user balance: %d emblems", updatedPlayer.Emblems)

				// Sending successful purchase message
				msgText := fmt.Sprintf("Successfully purchased %d emblems! Your new balance: %d emblems.",
					emblemAmount, updatedPlayer.Emblems)
				log.Printf("=== DEBUG === Sending message to user: %s", msgText)

				msg := tgbotapi.NewMessage(update.Message.Chat.ID, msgText)
				if _, err := bot.Send(msg); err != nil {
					log.Printf("=== ERROR === Error sending message: %v", err)
				} else {
					log.Printf("=== DEBUG === Message successfully sent")
				}
			} else {
				log.Printf("=== ERROR === Insufficient data to process payment: UserID=%s, EmblemAmount=%d",
					userIDStr, emblemAmount)
			}
		}
	})

	// Handler for processing purchases through Stars API
	http.HandleFunc("/api/process-purchase", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("=== DEBUG === Received direct Stars purchase processing request: %s %s", r.Method, r.URL.String())
		log.Printf("=== DEBUG === Headers: %v", r.Header)

		if r.Method != http.MethodPost && r.Method != http.MethodOptions {
			log.Printf("=== ERROR === Invalid request method: %s", r.Method)
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// CORS setup
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Processing OPTIONS request (preflight)
		if r.Method == http.MethodOptions {
			log.Printf("=== DEBUG === Processing preflight OPTIONS request")
			w.WriteHeader(http.StatusOK)
			return
		}

		// Structure for receiving purchase data
		type PurchaseRequest struct {
			UserID         int64  `json:"user_id"`
			EmblemAmount   int    `json:"emblem_amount"`
			StarCost       int    `json:"star_cost"`
			PurchaseSource string `json:"purchase_source"`
			Timestamp      int64  `json:"timestamp"`
		}

		// Structure for response
		type PurchaseResponse struct {
			Success    bool   `json:"success"`
			NewBalance int64  `json:"new_balance"`
			Message    string `json:"message"`
			ApiVersion string `json:"api_version"`
		}

		// Read request body
		body, err := io.ReadAll(r.Body)
		if err != nil {
			log.Printf("=== ERROR === Error reading request body: %v", err)
			http.Error(w, "Error reading request", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// Log raw request for debugging
		log.Printf("=== DEBUG === Raw request body: %s", string(body))

		// Reset body for json.NewDecoder
		r.Body = io.NopCloser(bytes.NewBuffer(body))

		// Decoding JSON request
		var req PurchaseRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("=== ERROR === Error decoding JSON: %v", err)
			http.Error(w, "Invalid request format", http.StatusBadRequest)
			return
		}

		log.Printf("=== DEBUG === Purchase request data: UserID=%d, EmblemAmount=%d, StarCost=%d, Source=%s",
			req.UserID, req.EmblemAmount, req.StarCost, req.PurchaseSource)

		// Data validation
		if req.UserID <= 0 || req.EmblemAmount <= 0 || req.StarCost <= 0 {
			log.Printf("=== ERROR === Invalid request parameters: UserID=%d, EmblemAmount=%d, StarCost=%d",
				req.UserID, req.EmblemAmount, req.StarCost)
			http.Error(w, "Invalid request parameters", http.StatusBadRequest)
			return
		}

		// Определяем версию API на основе источника
		apiVersion := "legacy"
		if req.PurchaseSource == "stars_api_direct" {
			apiVersion = "stars_api_v1"
			log.Printf("=== DEBUG === Using modern Stars API (Version 1)")
		} else {
			log.Printf("=== DEBUG === Using legacy payment method")
		}

		// Adding emblems to the user
		log.Printf("=== DEBUG === Adding %d emblems to user %d via %s", req.EmblemAmount, req.UserID, apiVersion)

		// Converting emblems to int64
		emblemAmount := int64(req.EmblemAmount)

		err = playerUseCase.AddPlayerEmblems(req.UserID, emblemAmount)
		if err != nil {
			log.Printf("=== ERROR === Error adding emblems: %v", err)
			http.Error(w, fmt.Sprintf("Failed to add emblems: %v", err), http.StatusInternalServerError)
			return
		}

		// Getting updated player data
		player, err := playerUseCase.GetPlayerData(req.UserID)
		if err != nil {
			log.Printf("=== ERROR === Error getting player data: %v", err)
			http.Error(w, fmt.Sprintf("Failed to get player data: %v", err), http.StatusInternalServerError)
			return
		}

		log.Printf("=== DEBUG === Emblems successfully added. New balance: %d", player.Emblems)

		// Sending response
		resp := PurchaseResponse{
			Success:    true,
			NewBalance: player.Emblems,
			Message:    fmt.Sprintf("Successfully added %d emblems", req.EmblemAmount),
			ApiVersion: apiVersion,
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(resp); err != nil {
			log.Printf("=== ERROR === Error encoding response: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		log.Printf("=== DEBUG === Response successfully sent to client: %+v", resp)
	})

	// Starting HTTP server
	serverPort := os.Getenv("SERVER_PORT")
	if serverPort == "" {
		serverPort = "8080"
	}
	addr := fmt.Sprintf("0.0.0.0:%s", serverPort)
	log.Printf("Starting server on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Printf("Server error: %v", err)
	}
}

// Handler for start command in Telegram bot
func handleStartCommand(bot *tgbotapi.BotAPI, update tgbotapi.Update, playerUseCase *usecase.PlayerUseCase) {
	// Player registration
	player, err := playerUseCase.RegisterPlayer(
		update.Message.From.ID,
		update.Message.From.UserName,
	)
	if err != nil {
		log.Printf("Error registering player: %v", err)
		return
	}

	// Map of skill types to emoji/names
	skillTypeMap := map[string]struct {
		Name  string
		Emoji string
	}{
		"MAX_HEALTH":       {"Castle Strength", "🏰"},
		"DEFENSE":          {"Defense", "🛡️"},
		"HEALTH_REGEN":     {"Regeneration", "💖"},
		"DAMAGE":           {"Damage", "🔥"},
		"COIN_REWARD":      {"Gold Bonus", "💰"},
		"ATTACK_SPEED":     {"Attack Speed", "⚡"},
		"ATTACK_RANGE":     {"Attack Range", "🎯"},
		"MULTISHOT":        {"Multishot", "🏹"},
		"CRIT_CHANCE":      {"Crit Chance", "✨"},
		"CRIT_MULTIPLIER":  {"Crit Multiplier", "💥"},
		"KNOCKBACK":        {"Knockback", "👊"},
		"LIFESTEAL_CHANCE": {"Lifesteal Chance", "🧛"},
		"LIFESTEAL_AMOUNT": {"Lifesteal Amount", "💉"},
		"DAILY_GOLD":       {"Daily Gold", "🪙"},
		"EMBLEM_BONUS":     {"Emblem Bonus", "🎖️"},
		"FREE_UPGRADE":     {"Free Upgrade Chance", "🎁"},
		"SUPPLY_DROP":      {"Chest Chance", "📦"},
		"GAME_SPEED":       {"Game Speed", "⏩"},
	}

	welcomeMsg := "🎮 *Tower Tapper - Player Statistics* 🎮\n\n"
	welcomeMsg += fmt.Sprintf("👤 *Player:* %s\n", update.Message.From.UserName)
	welcomeMsg += fmt.Sprintf("💎 *Emblems:* %d\n", player.Emblems)

	// Getting player skills if they exist
	skills, err := playerUseCase.GetPlayerSkills(update.Message.From.ID)
	if err != nil {
		log.Printf("Error getting player skills: %v", err)
	} else if len(skills) > 0 {
		welcomeMsg += "\n📊 *Initial Skills:*\n"

		// Sorting skills by categories
		var attackSkills, defenseSkills, utilitySkills []*domain.PlayerSkill

		for _, skill := range skills {
			skillType := skill.SkillType

			switch skillType {
			case "DAMAGE", "ATTACK_SPEED", "ATTACK_RANGE", "MULTISHOT", "CRIT_CHANCE", "CRIT_MULTIPLIER":
				attackSkills = append(attackSkills, skill)
			case "MAX_HEALTH", "DEFENSE", "HEALTH_REGEN", "KNOCKBACK", "LIFESTEAL_AMOUNT", "LIFESTEAL_CHANCE":
				defenseSkills = append(defenseSkills, skill)
			default:
				utilitySkills = append(utilitySkills, skill)
			}
		}

		// Displaying attack skills
		if len(attackSkills) > 0 {
			welcomeMsg += "\n🗡️ *Attack Skills:*\n"
			for _, skill := range attackSkills {
				info, exists := skillTypeMap[skill.SkillType]
				if exists {
					welcomeMsg += fmt.Sprintf("   %s %s: Lvl. %d\n", info.Emoji, info.Name, skill.Level)
				} else {
					welcomeMsg += fmt.Sprintf("   %s: Lvl. %d\n", skill.SkillType, skill.Level)
				}
			}
		}

		// Displaying defense skills
		if len(defenseSkills) > 0 {
			welcomeMsg += "\n🛡️ *Defense Skills:*\n"
			for _, skill := range defenseSkills {
				info, exists := skillTypeMap[skill.SkillType]
				if exists {
					welcomeMsg += fmt.Sprintf("   %s %s: Lvl. %d\n", info.Emoji, info.Name, skill.Level)
				} else {
					welcomeMsg += fmt.Sprintf("   %s: Lvl. %d\n", skill.SkillType, skill.Level)
				}
			}
		}

		// Displaying utility skills
		if len(utilitySkills) > 0 {
			welcomeMsg += "\n🧩 *Utility Skills:*\n"
			for _, skill := range utilitySkills {
				info, exists := skillTypeMap[skill.SkillType]
				if exists {
					welcomeMsg += fmt.Sprintf("   %s %s: Lvl. %d\n", info.Emoji, info.Name, skill.Level)
				} else {
					welcomeMsg += fmt.Sprintf("   %s: Lvl. %d\n", skill.SkillType, skill.Level)
				}
			}
		}
	} else {
		welcomeMsg += "\n👉 You don't have any Initial skills yet. Play and upgrade your skills!"
	}

	msg := tgbotapi.NewMessage(update.Message.Chat.ID, welcomeMsg)
	msg.ParseMode = "Markdown"

	clientURL := os.Getenv("CLIENT_URL")
	fullGameURL := fmt.Sprintf("http://%s?telegram_id=%d", clientURL, update.Message.From.ID)
	keyboard := tgbotapi.NewInlineKeyboardMarkup(
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonURL("🎮 Play Tower Tapper", fullGameURL),
		),
		tgbotapi.NewInlineKeyboardRow(
			tgbotapi.NewInlineKeyboardButtonURL("💎 Buy Emblems", fullGameURL+"&shop=true"),
		),
	)

	msg.ReplyMarkup = keyboard

	if _, err := bot.Send(msg); err != nil {
		log.Printf("Error sending message: %v", err)
	}
}
