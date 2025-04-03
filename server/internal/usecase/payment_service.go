package usecase

import (
	"fmt"
	"time"

	"github.com/tiebetie/TowerTapper/internal/domain"
)

type paymentService struct {
	repo     domain.Repository
	provider string // Telegram payment provider token
}

func NewPaymentService(repo domain.Repository, provider string) domain.PaymentService {
	return &paymentService{
		repo:     repo,
		provider: provider,
	}
}

func (s *paymentService) CreateInvoice(req *domain.CreatePaymentRequest) (*domain.Payment, error) {
	// Validate request
	if req.Amount <= 0 || req.EmblemsQty <= 0 {
		return nil, fmt.Errorf("invalid payment amount or emblems quantity")
	}

	// Create payment record
	payment := &domain.Payment{
		PlayerID:   req.PlayerID,
		Amount:     req.Amount,
		EmblemsQty: req.EmblemsQty,
		Status:     "pending",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	// Save payment to database first to get the ID
	if err := s.repo.CreatePayment(payment); err != nil {
		return nil, fmt.Errorf("failed to save payment: %w", err)
	}

	// Generate Telegram payment URL
	// Note: You'll need to configure your Telegram bot with @BotFather to enable payments
	// and get the payment provider token
	payment.InvoiceURL = fmt.Sprintf(
		"https://t.me/$botusername?start=payment_%d_%d_%d",
		payment.ID,         // Payment ID
		payment.Amount,     // Stars amount
		payment.EmblemsQty, // Emblems quantity
	)

	// Update payment with invoice URL
	if err := s.repo.UpdatePayment(payment); err != nil {
		return nil, fmt.Errorf("failed to update payment: %w", err)
	}

	return payment, nil
}

func (s *paymentService) ProcessPayment(paymentID int64, status string) error {
	// Get payment from database
	payment, err := s.repo.GetPaymentByID(paymentID)
	if err != nil {
		return fmt.Errorf("failed to get payment: %w", err)
	}

	// Update payment status
	payment.Status = status
	payment.UpdatedAt = time.Now()

	// If payment successful, update player's emblems
	if status == "completed" {
		now := time.Now()
		payment.CompletedAt = &now

		// Get player by Telegram ID
		player, err := s.repo.GetPlayerByTelegramID(payment.PlayerID)
		if err != nil {
			return fmt.Errorf("failed to get player: %w", err)
		}

		// Add emblems to player's balance
		player.Emblems += payment.EmblemsQty
		player.UpdatedAt = time.Now()

		// Update player in database
		if err := s.repo.UpdatePlayer(player); err != nil {
			return fmt.Errorf("failed to update player: %w", err)
		}
	}

	// Update payment in database
	if err := s.repo.UpdatePayment(payment); err != nil {
		return fmt.Errorf("failed to update payment: %w", err)
	}

	return nil
}
