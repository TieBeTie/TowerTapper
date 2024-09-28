package main

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/tiebetie/TowerDefenseClicker/internal/handlers"
	// другие необходимые импорты
)

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/ws", handlers.GameHandler)
	http.Handle("/", r)
	http.ListenAndServe(":8080", nil)
}
