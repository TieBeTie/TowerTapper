package main

import (
	"database/sql"
	"log"
	"os"
	"time"

	"github.com/tiebetie/TowerTapper/pkg/database"
)

func InitDB() (*sql.DB, error) {
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
		return nil, err
	}
	// Create tables
	if err := database.CreateTables(db); err != nil {
		return nil, err
	}
	return db, nil
}
