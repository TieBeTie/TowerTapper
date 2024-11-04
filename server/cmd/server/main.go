package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/gorilla/mux"
	"github.com/tiebetie/TowerTapper/internal/handlers"
	"github.com/tiebetie/TowerTapper/internal/middlewares"
	"github.com/tiebetie/TowerTapper/internal/utils"
	"github.com/tiebetie/TowerTapper/pkg/config"
	"github.com/tiebetie/TowerTapper/pkg/database"
)

func main() {
	// Initialize Logger
	utils.InitLogger()

	// Load Configuration
	config.LoadAppConfig()

	// Connect to Database
	database.Connect()

	r := mux.NewRouter()

	// Apply the authentication middleware to all routes
	r.Use(middlewares.AuthMiddleware)

	r.HandleFunc("/ws", handlers.GameHandler)
	r.HandleFunc("/telegram", handlers.TelegramHandler).Methods("POST")
	r.HandleFunc("/user", handlers.UserHandler).Methods("GET")

	srv := &http.Server{
		Handler:      r,
		Addr:         ":" + config.AppConfig.Port,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	// Channel to listen for errors coming from the listener
	serverErrors := make(chan error, 1)

	// Start the server
	go func() {
		log.Println("Server is running on port", config.AppConfig.Port)
		serverErrors <- srv.ListenAndServe()
	}()

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt)

	// Block until we receive a signal or server error
	select {
	case err := <-serverErrors:
		log.Fatalf("Error starting server: %v", err)

	case sig := <-sigChan:
		log.Printf("Received %v, initiating graceful shutdown", sig)

		// Create a deadline to wait for current operations to finish
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		// Attempt the graceful shutdown
		if err := srv.Shutdown(ctx); err != nil {
			log.Fatalf("Graceful shutdown failed: %v", err)
		}

		log.Println("Server gracefully stopped")
	}
}
