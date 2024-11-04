package database

import (
	"log"
	"time"

	"database/sql"

	_ "github.com/lib/pq"
	"github.com/tiebetie/TowerTapper/pkg/config"
)

// DB is the global database connection pool
var DB *sql.DB

// Connect initializes the database connection with retry logic
func Connect() {
	var err error
	retries := 5
	for i := 0; i < retries; i++ {
		DB, err = sql.Open("postgres", config.AppConfig.DatabaseURL)
		if err != nil {
			log.Printf("Failed to open database connection: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}

		err = DB.Ping()
		if err != nil {
			log.Printf("Failed to ping database: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}

		log.Println("Successfully connected to the PostgreSQL database")
		return
	}

	log.Fatalf("Could not connect to the database after %d attempts", retries)
}
