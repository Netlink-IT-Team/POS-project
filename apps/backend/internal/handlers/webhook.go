package handlers

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/kopiko-pos/backend/internal/models"
	"github.com/kopiko-pos/backend/internal/service"
)

type WebhookHandler struct {
	mu            sync.Mutex
	processedIDs  map[string]bool
	xenditSvc     *service.XenditService
	txHandler     *TransactionHandler
}

func NewWebhookHandler(xenditSvc *service.XenditService, txHandler *TransactionHandler) *WebhookHandler {
	return &WebhookHandler{
		processedIDs: make(map[string]bool),
		xenditSvc:    xenditSvc,
		txHandler:    txHandler,
	}
}

func (h *WebhookHandler) HandleXenditCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// 1. Verify Xendit Callback Token (Anti-spoofing)
	callbackToken := r.Header.Get("x-callback-token")
	if !h.xenditSvc.VerifyWebhookToken(callbackToken) {
		http.Error(w, `{"error":"Invalid x-callback-token"}`, http.StatusUnauthorized)
		return
	}

	var payload models.XenditWebhookPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, `{"error":"Invalid webhook JSON body"}`, http.StatusBadRequest)
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	// 2. Prevent duplicate webhook replay
	if h.processedIDs[payload.ID] {
		// Return 200 OK to acknowledge receipt without reprocessing
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"already_processed"}`))
		return
	}

	// 3. Update payment status if paid
	if payload.Status == "PAID" || payload.Status == "SETTLED" || payload.Status == "COMPLETED" {
		h.txHandler.MarkAsPaid(payload.ExternalID)
	}

	h.processedIDs[payload.ID] = true

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"status":"success"}`))
}

