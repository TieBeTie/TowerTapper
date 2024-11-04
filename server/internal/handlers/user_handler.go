package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/tiebetie/TowerTapper/internal/models"
	"github.com/tiebetie/TowerTapper/internal/services"
)

// UserResponse represents the response structure for the UserHandler
type UserResponse struct {
	Message string       `json:"message"`
	User    *models.User `json:"user,omitempty"`
}

// UserHandler handles user-related requests
func UserHandler(w http.ResponseWriter, r *http.Request) {
	// Assume user ID is passed as a query parameter
	userIDStr := r.URL.Query().Get("id")
	if userIDStr == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid User ID", http.StatusBadRequest)
		return
	}

	userService := services.NewUserService()
	user, err := userService.GetUser(userID)
	if err != nil {
		log.Printf("Error retrieving user: %v", err)
		// Differentiate between not found and other errors
		if err.Error() == "user not found" {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to retrieve user", http.StatusInternalServerError)
		}
		return
	}

	// Ensure password is not sent in the response
	user.Password = ""

	response := UserResponse{
		Message: "User retrieved successfully",
		User:    user,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
	}
}
