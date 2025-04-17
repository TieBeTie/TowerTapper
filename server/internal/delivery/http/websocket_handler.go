package http

import (
	"net/http"
)

type WebsocketHandler struct {
	wsHandlerFunc http.HandlerFunc
}

func NewWebsocketHandler(wsHandlerFunc http.HandlerFunc) *WebsocketHandler {
	return &WebsocketHandler{wsHandlerFunc: wsHandlerFunc}
}

func (h *WebsocketHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/ws", h.wsHandlerFunc)
}
