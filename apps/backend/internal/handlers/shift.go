package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/kopiko-pos/backend/internal/models"
)

type ShiftHandler struct {
	mu     sync.RWMutex
	shifts map[string]*models.BoothShift
	audits map[string][]models.ShiftStockAudit
}

func NewShiftHandler() *ShiftHandler {
	handler := &ShiftHandler{
		shifts: make(map[string]*models.BoothShift),
		audits: make(map[string][]models.ShiftStockAudit),
	}

	// Seed with an initial active shift
	initShiftID := "shift-today-01"
	openedTime := time.Now().Add(-4 * time.Hour)
	handler.shifts[initShiftID] = &models.BoothShift{
		ID:          initShiftID,
		BoothID:     "booth-01",
		CashierID:   "usr-1",
		ShiftNumber: 1,
		Status:      models.ShiftStatusOpen,
		OpenedAt:    openedTime,
		OpeningCash: 200000,
		CreatedAt:   openedTime,
		UpdatedAt:   openedTime,
	}

	// Initial opening audits
	handler.audits[initShiftID] = []models.ShiftStockAudit{
		{
			ID:               "audit-open-1",
			ShiftID:          initShiftID,
			ItemName:         "Kopiko Coffee Powder",
			TrackingType:     models.AuditTrackingWeighed,
			MeasuredQuantity: 5200,
			Unit:             "grams",
			Stage:            models.AuditStageOpening,
			PhotoURL:         "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800",
			CreatedAt:        openedTime,
		},
		{
			ID:               "audit-open-2",
			ShiftID:          initShiftID,
			ItemName:         "Gula Aren Liquid",
			TrackingType:     models.AuditTrackingWeighed,
			MeasuredQuantity: 4100,
			Unit:             "grams",
			Stage:            models.AuditStageOpening,
			PhotoURL:         "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800",
			CreatedAt:        openedTime,
		},
		{
			ID:               "audit-open-3",
			ShiftID:          initShiftID,
			ItemName:         "Paper Cup 12oz",
			TrackingType:     models.AuditTrackingCounted,
			MeasuredQuantity: 150,
			Unit:             "pcs",
			Stage:            models.AuditStageOpening,
			PhotoURL:         "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800",
			CreatedAt:        openedTime,
		},
	}

	return handler
}

func (h *ShiftHandler) OpenShift(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.OpenShiftRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if req.BoothID == "" || req.CashierID == "" {
		http.Error(w, `{"error":"booth_id and cashier_id are required"}`, http.StatusBadRequest)
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	shiftID := fmt.Sprintf("shift-%d", time.Now().Unix())
	now := time.Now()

	shift := &models.BoothShift{
		ID:          shiftID,
		BoothID:     req.BoothID,
		CashierID:   req.CashierID,
		ShiftNumber: req.ShiftNumber,
		Status:      models.ShiftStatusOpen,
		OpenedAt:    now,
		OpeningCash: req.OpeningCash,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	h.shifts[shiftID] = shift

	var savedAudits []models.ShiftStockAudit
	for i, item := range req.AuditItems {
		audit := models.ShiftStockAudit{
			ID:               fmt.Sprintf("audit-%s-%d", shiftID, i),
			ShiftID:          shiftID,
			StockItemID:      item.StockItemID,
			ItemName:         item.ItemName,
			TrackingType:     item.TrackingType,
			MeasuredQuantity: item.MeasuredQuantity,
			Unit:             item.Unit,
			Stage:            models.AuditStageOpening,
			PhotoURL:         item.PhotoURL,
			CreatedAt:        now,
		}
		savedAudits = append(savedAudits, audit)
	}
	h.audits[shiftID] = savedAudits

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message":     "Shift opened successfully",
		"shift":       shift,
		"audit_count": len(savedAudits),
	})
}

func (h *ShiftHandler) CloseShift(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.CloseShiftRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	shift, exists := h.shifts[req.ShiftID]
	if !exists {
		http.Error(w, `{"error":"Shift not found"}`, http.StatusNotFound)
		return
	}

	if shift.Status == models.ShiftStatusClosed {
		http.Error(w, `{"error":"Shift is already closed"}`, http.StatusBadRequest)
		return
	}

	now := time.Now()
	expectedCash := shift.OpeningCash + 754000 // In prod: sum of successful cash transactions
	discrepancy := req.ClosingCashActual - expectedCash

	shift.Status = models.ShiftStatusClosed
	shift.ClosedAt = &now
	shift.ClosingCashActual = &req.ClosingCashActual
	shift.ClosingCashExpected = &expectedCash
	shift.CashDiscrepancy = &discrepancy
	shift.ClosingNotes = req.ClosingNotes
	shift.UpdatedAt = now

	// Save closing audits
	for i, item := range req.AuditItems {
		audit := models.ShiftStockAudit{
			ID:               fmt.Sprintf("audit-close-%s-%d", req.ShiftID, i),
			ShiftID:          req.ShiftID,
			StockItemID:      item.StockItemID,
			ItemName:         item.ItemName,
			TrackingType:     item.TrackingType,
			MeasuredQuantity: item.MeasuredQuantity,
			Unit:             item.Unit,
			Stage:            models.AuditStageClosing,
			PhotoURL:         item.PhotoURL,
			CreatedAt:        now,
		}
		h.audits[req.ShiftID] = append(h.audits[req.ShiftID], audit)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message":          "Shift closed successfully",
		"shift":            shift,
		"cash_discrepancy": discrepancy,
	})
}


