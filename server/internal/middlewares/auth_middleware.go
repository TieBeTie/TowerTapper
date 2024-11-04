package middlewares

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
)

// AuthMiddleware handles authentication for incoming requests
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Unauthorized: No Authorization header provided", http.StatusUnauthorized)
			return
		}

		// Assume the format is "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "Unauthorized: Invalid Authorization header format", http.StatusUnauthorized)
			return
		}

		token := parts[1]
		// Validate the token (e.g., JWT validation)
		if !validateToken(token) {
			http.Error(w, "Unauthorized: Invalid token", http.StatusUnauthorized)
			return
		}

		// Token is valid; proceed to the next handler
		next.ServeHTTP(w, r)
	})
}

// validateToken validates the provided JWT token
func validateToken(tokenString string) bool {
	// Parse the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Ensure the signing method is HMAC
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		log.Printf("Token parsing error: %v", err)
		return false
	}

	// Validate the token
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		// Check token expiration
		if exp, ok := claims["exp"].(float64); ok {
			if int64(exp) < time.Now().Unix() {
				log.Println("Token has expired")
				return false
			}
		}
		return true
	}

	return false
}
