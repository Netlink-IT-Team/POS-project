package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/kopiko-pos/backend/internal/models"
	"github.com/kopiko-pos/backend/internal/service"
)

type TransactionHandler struct {
	mu           sync.RWMutex
	transactions map[string]*models.Transaction
	xenditSvc    *service.XenditService
}

func NewTransactionHandler(xenditSvc *service.XenditService) *TransactionHandler {
	return &TransactionHandler{
		transactions: make(map[string]*models.Transaction),
		xenditSvc:    xenditSvc,
	}
}

func (h *TransactionHandler) CreateTransaction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	idempotencyKey := r.Header.Get("Idempotency-Key")
	if idempotencyKey == "" {
		http.Error(w, `{"error":"Header 'Idempotency-Key' is required"}`, http.StatusBadRequest)
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	// Check if already processed (Idempotency shield)
	if existing, found := h.transactions[idempotencyKey]; found {
		resp := models.CheckoutResponse{
			TransactionID:    existing.ID,
			IdempotencyKey:   existing.IdempotencyKey,
			PaymentMethod:    existing.PaymentMethod,
			Status:           existing.Status,
			TotalAmount:      existing.TotalAmount,
			XenditPaymentURL: existing.XenditPaymentURL,
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
		return
	}

	var req models.CheckoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if req.BoothID == "" || req.TotalAmount <= 0 {
		http.Error(w, `{"error":"booth_id and total_amount > 0 are required"}`, http.StatusBadRequest)
		return
	}

	txID := fmt.Sprintf("tx-%d", time.Now().UnixNano())
	now := time.Now()

	tx := &models.Transaction{
		ID:             txID,
		BoothID:        req.BoothID,
		ShiftID:        &req.ShiftID,
		IdempotencyKey: idempotencyKey,
		PaymentMethod:  req.PaymentMethod,
		Status:         models.PaymentStatusPending,
		TotalAmount:    req.TotalAmount,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	var qrData string
	var paymentURL string
	var change float64

	if req.PaymentMethod == models.PaymentMethodQRIS {
		invID, qr, pURL, err := h.xenditSvc.GenerateDynamicQRIS(idempotencyKey, req.TotalAmount, req.BoothID)
		if err == nil {
			tx.XenditInvoiceID = invID
			tx.XenditPaymentURL = pURL
			qrData = qr
			paymentURL = pURL
		}
	} else {
		// Cash payment completed immediately at cashier
		tx.Status = models.PaymentStatusCompleted
		if req.CashReceived >= req.TotalAmount {
			change = req.CashReceived - req.TotalAmount
		}
	}

	h.transactions[idempotencyKey] = tx
	log.Printf("[Kopiko Backend] 🛒 Transaksi Baru Tercatat: ID=%s, Booth=%s, Method=%s, Total=Rp %.0f\n",
		tx.ID, tx.BoothID, tx.PaymentMethod, tx.TotalAmount)

	resp := models.CheckoutResponse{
		TransactionID:    tx.ID,
		IdempotencyKey:   idempotencyKey,
		PaymentMethod:    tx.PaymentMethod,
		Status:           tx.Status,
		TotalAmount:      tx.TotalAmount,
		Change:           change,
		QRISData:         qrData,
		XenditPaymentURL: paymentURL,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(resp)
}

func (h *TransactionHandler) SyncTransactions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.SyncTransactionsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	var syncedKeys []string
	skippedCount := 0

	now := time.Now()
	for _, item := range req.Transactions {
		if _, exists := h.transactions[item.IdempotencyKey]; exists {
			skippedCount++
			continue
		}

		tx := &models.Transaction{
			ID:               fmt.Sprintf("tx-sync-%d", time.Now().UnixNano()),
			BoothID:          item.BoothID,
			ShiftID:          &item.ShiftID,
			CashierID:        &item.CashierID,
			IdempotencyKey:   item.IdempotencyKey,
			PaymentMethod:    item.PaymentMethod,
			Status:           item.Status,
			TotalAmount:      item.TotalAmount,
			OfflineCreatedAt: &item.OfflineCreatedAt,
			CreatedAt:        now,
			UpdatedAt:        now,
		}

		h.transactions[item.IdempotencyKey] = tx
		syncedKeys = append(syncedKeys, item.IdempotencyKey)
	}

	resp := models.SyncTransactionsResponse{
		SyncedCount: len(syncedKeys),
		Skipped:     skippedCount,
		SyncedKeys:  syncedKeys,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

func (h *TransactionHandler) MarkAsPaid(externalID string) bool {
	h.mu.Lock()
	defer h.mu.Unlock()

	if tx, found := h.transactions[externalID]; found {
		tx.Status = models.PaymentStatusCompleted
		tx.UpdatedAt = time.Now()
		return true
	}
	return false
}

// GetTransactionStatus handles polling for QRIS payment status
func (h *TransactionHandler) GetTransactionStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	key := r.URL.Query().Get("key")
	if key == "" {
		http.Error(w, `{"error":"Query parameter 'key' is required"}`, http.StatusBadRequest)
		return
	}

	h.mu.RLock()
	tx, found := h.transactions[key]
	h.mu.RUnlock()

	if !found {
		http.Error(w, `{"error":"Transaction not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"idempotency_key":   tx.IdempotencyKey,
		"status":            tx.Status,
		"payment_method":    tx.PaymentMethod,
		"total_amount":      tx.TotalAmount,
		"xendit_invoice_id": tx.XenditInvoiceID,
	})
}

// SimulatePayment allows instant cashier simulation/testing for QRIS payment
func (h *TransactionHandler) SimulatePayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	key := r.URL.Query().Get("key")
	if key == "" {
		http.Error(w, `{"error":"Query parameter 'key' is required"}`, http.StatusBadRequest)
		return
	}

	success := h.MarkAsPaid(key)
	if !success {
		http.Error(w, `{"error":"Transaction not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "completed",
		"message": "Payment simulation succeeded",
	})
}

