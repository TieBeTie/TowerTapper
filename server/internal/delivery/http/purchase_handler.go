package http

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/tiebetie/TowerTapper/internal/usecase"
)

type PurchaseHandler struct {
	playerUseCase *usecase.PlayerUseCase
}

func NewPurchaseHandler(playerUseCase *usecase.PlayerUseCase) *PurchaseHandler {
	return &PurchaseHandler{playerUseCase: playerUseCase}
}

func (h *PurchaseHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/process-purchase", h.ProcessPurchase)
	mux.HandleFunc("/api/refund-payment", h.RefundPayment)
	mux.HandleFunc("/api/create-invoice", h.CreateInvoice)
	mux.HandleFunc("/api/refund-request", h.RefundRequest)
}

func (h *PurchaseHandler) ProcessPurchase(w http.ResponseWriter, r *http.Request) {
	log.Printf("=== DEBUG === Received Stars API purchase request: %s %s", r.Method, r.URL.String())
	log.Printf("=== DEBUG === Headers: %v", r.Header)

	if r.Method != http.MethodPost && r.Method != http.MethodOptions {
		log.Printf("=== ERROR === Invalid request method: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

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

	type PurchaseResponse struct {
		Success    bool   `json:"success"`
		NewBalance int64  `json:"new_balance"`
		Message    string `json:"message"`
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("=== ERROR === Error reading request body: %v", err)
		http.Error(w, "Error reading request", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	log.Printf("=== DEBUG === Raw request body: %s", string(body))

	r.Body = io.NopCloser(io.Reader(io.MultiReader(io.NopCloser(io.Reader(io.MultiReader()))))) // dummy reset, actual reset not needed here

	var req PurchaseRequest
	if err := json.Unmarshal(body, &req); err != nil {
		log.Printf("=== ERROR === Error decoding JSON: %v", err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	log.Printf("=== DEBUG === Purchase request data: UserID=%d, EmblemAmount=%d, StarCost=%d, Source=%s",
		req.UserID, req.EmblemAmount, req.StarCost, req.PurchaseSource)

	if req.UserID <= 0 || req.EmblemAmount <= 0 || req.StarCost <= 0 {
		log.Printf("=== ERROR === Invalid request parameters: UserID=%d, EmblemAmount=%d, StarCost=%d",
			req.UserID, req.EmblemAmount, req.StarCost)
		http.Error(w, "Invalid request parameters", http.StatusBadRequest)
		return
	}

	log.Printf("=== DEBUG === Adding %d emblems to user %d via Stars API", req.EmblemAmount, req.UserID)

	emblemAmount := int64(req.EmblemAmount)
	err = h.playerUseCase.AddPlayerEmblems(req.UserID, emblemAmount)
	if err != nil {
		log.Printf("=== ERROR === Error adding emblems: %v", err)
		http.Error(w, fmt.Sprintf("Failed to add emblems: %v", err), http.StatusInternalServerError)
		return
	}

	player, err := h.playerUseCase.GetPlayerData(req.UserID)
	if err != nil {
		log.Printf("=== ERROR === Error getting player data: %v", err)
		http.Error(w, fmt.Sprintf("Failed to get player data: %v", err), http.StatusInternalServerError)
		return
	}

	log.Printf("=== DEBUG === Emblems successfully added. New balance: %d", player.Emblems)

	resp := PurchaseResponse{
		Success:    true,
		NewBalance: player.Emblems,
		Message:    fmt.Sprintf("Successfully added %d emblems", req.EmblemAmount),
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Printf("=== ERROR === Error encoding response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	log.Printf("=== DEBUG === Response successfully sent to client: %+v", resp)
}

func (h *PurchaseHandler) RefundPayment(w http.ResponseWriter, r *http.Request) {
	log.Printf("=== DEBUG === Received refund request: %s %s", r.Method, r.URL.String())
	log.Printf("=== DEBUG === Headers: %v", r.Header)

	if r.Method != http.MethodPost && r.Method != http.MethodOptions {
		log.Printf("=== ERROR === Invalid request method: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == http.MethodOptions {
		log.Printf("=== DEBUG === Processing preflight OPTIONS request")
		w.WriteHeader(http.StatusOK)
		return
	}

	type RefundRequest struct {
		PaymentID    string `json:"payment_id"`
		UserID       int64  `json:"user_id"`
		RefundAmount int    `json:"refund_amount"`
		RefundReason string `json:"refund_reason"`
	}

	type RefundResponse struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("=== ERROR === Error reading request body: %v", err)
		http.Error(w, "Error reading request", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	log.Printf("=== DEBUG === Raw request body: %s", string(body))

	var req RefundRequest
	if err := json.Unmarshal(body, &req); err != nil {
		log.Printf("=== ERROR === Error decoding JSON: %v", err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	log.Printf("=== DEBUG === Refund request data: PaymentID=%s, UserID=%d, RefundAmount=%d, Reason=%s",
		req.PaymentID, req.UserID, req.RefundAmount, req.RefundReason)

	if req.PaymentID == "" || req.UserID <= 0 || req.RefundAmount <= 0 {
		log.Printf("=== ERROR === Invalid refund parameters: PaymentID=%s, UserID=%d, RefundAmount=%d",
			req.PaymentID, req.UserID, req.RefundAmount)
		http.Error(w, "Invalid request parameters", http.StatusBadRequest)
		return
	}

	// Здесь должна быть реальная логика возврата, сейчас просто mock
	success := true
	message := fmt.Sprintf("Successfully refunded %d stars for payment %s", req.RefundAmount, req.PaymentID)
	if req.RefundAmount > 1000 {
		success = false
		message = "Refund amount exceeds allowed limit"
	}

	resp := RefundResponse{
		Success: success,
		Message: message,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Printf("=== ERROR === Error encoding response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	log.Printf("=== DEBUG === Refund response sent: %+v", resp)
}

func (h *PurchaseHandler) CreateInvoice(w http.ResponseWriter, r *http.Request) {
	log.Printf("=== DEBUG === Received invoice creation request: %s %s", r.Method, r.URL.String())

	if r.Method != http.MethodPost {
		log.Printf("=== ERROR === Invalid request method: %s", r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		log.Printf("=== DEBUG === Processing preflight OPTIONS request")
		w.WriteHeader(http.StatusOK)
		return
	}

	type InvoiceRequest struct {
		UserID       int64 `json:"user_id"`
		EmblemAmount int   `json:"emblem_amount"`
		StarCost     int   `json:"star_cost"`
	}

	type InvoiceResponse struct {
		InvoiceLink string `json:"invoice_link"`
	}

	var req InvoiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("=== ERROR === Error decoding JSON: %v", err)
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	log.Printf("=== DEBUG === Request data: UserID=%d, EmblemAmount=%d, StarCost=%d",
		req.UserID, req.EmblemAmount, req.StarCost)

	if req.UserID <= 0 || req.EmblemAmount <= 0 || req.StarCost <= 0 {
		log.Printf("=== ERROR === Invalid request parameters: UserID=%d, EmblemAmount=%d, StarCost=%d",
			req.UserID, req.EmblemAmount, req.StarCost)
		http.Error(w, "Invalid request parameters", http.StatusBadRequest)
		return
	}

	// Creating URL for payment via Deep Link Bot API (mock)
	botUsername := "TowerTapperBot" // TODO: получить из конфига/окружения
	startParam := fmt.Sprintf("buy_emblems_%d_%d", req.EmblemAmount, req.StarCost)
	invoiceLink := fmt.Sprintf("tg://resolve?domain=%s&start=%s", botUsername, startParam)

	log.Printf("=== DEBUG === Created payment link: %s", invoiceLink)
	log.Printf("=== DEBUG === User data: UserID=%d, Emblems=%d, Stars=%d",
		req.UserID, req.EmblemAmount, req.StarCost)

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
}

func (h *PurchaseHandler) RefundRequest(w http.ResponseWriter, r *http.Request) {
	log.Printf("=== DEBUG === Received refund request for user %s", r.URL.Query().Get("user_id"))

	// Здесь должна быть реализация вызова Telegram Bot API метода refundStarPayment
	// https://core.telegram.org/bots/api#refundstarpayment

	// Логируем попытку возврата средств
	log.Printf("=== DEBUG === Attempting to refund stars for user %s", r.URL.Query().Get("user_id"))

	// Mock success response (в реальном коде здесь будет вызов API)
	success := true
	message := fmt.Sprintf("Successfully refunded stars for user %s", r.URL.Query().Get("user_id"))

	if r.URL.Query().Get("user_id") > "1000" {
		// Мок ошибки для больших сумм
		success = false
		message = "Refund amount exceeds allowed limit"
	}

	log.Printf("=== DEBUG === Refund result: success=%t, message=%s", success, message)

	// Отвечаем на запрос, чтобы убрать "часики" на кнопке
	// callback_id и chat_id могут быть пустыми, если не переданы
	callbackID := r.URL.Query().Get("callback_id")
	if callbackID != "" {
		// Здесь должен быть вызов Telegram API для callback, если нужно
		log.Printf("=== DEBUG === Would answer callback_id: %s", callbackID)
	}

	chatIDStr := r.URL.Query().Get("chat_id")
	if chatIDStr != "" {
		log.Printf("=== DEBUG === Would send message to chat_id: %s", chatIDStr)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": success,
		"message": message,
	})
}
