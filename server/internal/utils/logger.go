package utils

import (
	"go.uber.org/zap"
)

// Logger is the global logger instance
var Logger *zap.Logger

// InitLogger initializes the zap logger
func InitLogger() {
	var err error
	Logger, err = zap.NewProduction()
	if err != nil {
		panic(err)
	}
}
