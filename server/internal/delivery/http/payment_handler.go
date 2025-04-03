package http

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/tiebetie/TowerTapper/internal/domain"
)

type PaymentHandler struct {
	paymentService domain.PaymentService
}

func NewPaymentHandler(paymentService domain.PaymentService) *PaymentHandler {
	return &PaymentHandler{
		paymentService: paymentService,
	}
}

func (h *PaymentHandler) RegisterRoutes(router *mux.Router) {
	router.HandleFunc("/api/payments", h.CreateInvoice).Methods("POST")
	router.HandleFunc("/api/payments/{id}/callback", h.PaymentCallback).Methods("POST")
}

func (h *PaymentHandler) CreateInvoice(w http.ResponseWriter, r *http.Request) {
	var req domain.CreatePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	payment, err := h.paymentService.CreateInvoice(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"invoiceUrl": payment.InvoiceURL,
	})
}

// PaymentCallback обрабатывает обратный вызов от платежной системы Telegram
func (h *PaymentHandler) PaymentCallback(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	paymentID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil {
		http.Error(w, "Invalid payment ID", http.StatusBadRequest)
		return
	}

	var callback struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&callback); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.paymentService.ProcessPayment(paymentID, callback.Status); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
	})
}
