package http

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/tiebetie/TowerTapper/internal/usecase"
)

type RatingHandler struct {
	playerUseCase *usecase.PlayerUseCase
}

func NewRatingHandler(playerUseCase *usecase.PlayerUseCase) *RatingHandler {
	return &RatingHandler{playerUseCase: playerUseCase}
}

func (h *RatingHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/rating/top", h.Top)
	mux.HandleFunc("/api/rating/rank", h.Rank)
}

func (h *RatingHandler) Top(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method not allowed"})
		return
	}
	limit := 10
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	players, err := h.playerUseCase.GetTopPlayersByMaxWave(limit)
	if err != nil {
		log.Printf("/api/rating/top error: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to get top players"})
		return
	}
	type respPlayer struct {
		ID               int64  `json:"id"`
		TelegramID       int64  `json:"telegram_id"`
		Username         string `json:"username"`
		MaxWaveCompleted int    `json:"max_wave_completed"`
	}
	resp := make([]respPlayer, 0, len(players))
	for _, p := range players {
		resp = append(resp, respPlayer{
			ID:               p.ID,
			TelegramID:       p.TelegramID,
			Username:         p.Username,
			MaxWaveCompleted: p.MaxWaveCompleted,
		})
	}
	json.NewEncoder(w).Encode(resp)
}

func (h *RatingHandler) Rank(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{"error": "Method not allowed"})
		return
	}
	telegramIDStr := r.URL.Query().Get("telegram_id")
	if telegramIDStr == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Missing telegram_id"})
		return
	}
	telegramID, err := strconv.ParseInt(telegramIDStr, 10, 64)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid telegram_id"})
		return
	}
	rank, err := h.playerUseCase.GetPlayerRankByMaxWave(telegramID)
	if err != nil {
		log.Printf("/api/rating/rank error: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to get player rank"})
		return
	}
	json.NewEncoder(w).Encode(map[string]int{"rank": rank})
}
