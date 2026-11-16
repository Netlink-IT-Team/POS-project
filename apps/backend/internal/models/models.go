package models

import "time"

// Role and Status Enums
type UserRole string

const (
	RoleKasir UserRole = "kasir"
)

type ShiftStatus string

const (
	ShiftStatusOpen   ShiftStatus = "open"
	ShiftStatusClosed ShiftStatus = "closed"
)

type AuditTrackingType string

const (
	AuditTrackingWeighed AuditTrackingType = "weighed" // grams/scale
	AuditTrackingCounted AuditTrackingType = "counted" // units/cup/lid
)

type AuditStage string

const (
	AuditStageOpening AuditStage = "opening"
	AuditStageClosing AuditStage = "closing"
)

type PaymentMethod string

const (
	PaymentMethodCash PaymentMethod = "cash"
	PaymentMethodQRIS PaymentMethod = "qris"
)

type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusCompleted PaymentStatus = "completed"
	PaymentStatusFailed    PaymentStatus = "failed"
	PaymentStatusRefunded  PaymentStatus = "refunded"
)

// Domain Entities
type Booth struct {
	ID            string    `json:"id"`
	Code          string    `json:"code"`
	Name          string    `json:"name"`
	Region        string    `json:"region"`
	Address       string    `json:"address"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	StaticQRISURL string    `json:"static_qris_url,omitempty"`
	IsActive      bool      `json:"is_active"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Profile struct {
	ID        string    `json:"id"`
	Role      UserRole  `json:"role"`
	BoothID   *string   `json:"booth_id,omitempty"`
	FullName  string    `json:"full_name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type BoothShift struct {
	ID                 string      `json:"id"`
	BoothID            string      `json:"booth_id"`
	CashierID          string      `json:"cashier_id"`
	ShiftNumber        int         `json:"shift_number"`
	Status             ShiftStatus `json:"status"`
	OpenedAt           time.Time   `json:"opened_at"`
	ClosedAt           *time.Time  `json:"closed_at,omitempty"`
	OpeningCash        float64     `json:"opening_cash"`
	ClosingCashActual  *float64    `json:"closing_cash_actual,omitempty"`
	ClosingCashExpected *float64   `json:"closing_cash_expected,omitempty"`
	CashDiscrepancy    *float64    `json:"cash_discrepancy,omitempty"`
	ClosingNotes       string      `json:"closing_notes,omitempty"`
	CreatedAt          time.Time   `json:"created_at"`
	UpdatedAt          time.Time   `json:"updated_at"`
}

type ShiftStockAudit struct {
	ID               string            `json:"id"`
	ShiftID          string            `json:"shift_id"`
	StockItemID      *string           `json:"stock_item_id,omitempty"`
	ItemName         string            `json:"item_name"`
	TrackingType     AuditTrackingType `json:"tracking_type"`
	MeasuredQuantity float64           `json:"measured_quantity"`
	Unit             string            `json:"unit"`
	Stage            AuditStage        `json:"stage"`
	PhotoURL         string            `json:"photo_url"`
	Notes            string            `json:"notes,omitempty"`
	CreatedAt        time.Time         `json:"created_at"`
}

type MenuItem struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	SKU         string    `json:"sku"`
	Description string    `json:"description,omitempty"`
	Price       float64   `json:"price"`
	ImageURL    string    `json:"image_url,omitempty"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Transaction struct {
	ID               string        `json:"id"`
	BoothID          string        `json:"booth_id"`
	ShiftID          *string       `json:"shift_id,omitempty"`
	CashierID        *string       `json:"cashier_id,omitempty"`
	IdempotencyKey   string        `json:"idempotency_key"`
	PaymentMethod    PaymentMethod `json:"payment_method"`
	Status           PaymentStatus `json:"status"`
	TotalAmount      float64       `json:"total_amount"`
	XenditInvoiceID  string        `json:"xendit_invoice_id,omitempty"`
	XenditPaymentURL string        `json:"xendit_payment_url,omitempty"`
	OfflineCreatedAt *time.Time    `json:"offline_created_at,omitempty"`
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
}

type TransactionItem struct {
	ID            string  `json:"id"`
	TransactionID string  `json:"transaction_id"`
	MenuID        string  `json:"menu_id"`
	Quantity      int     `json:"quantity"`
	PricePerUnit  float64 `json:"price_per_unit"`
	Subtotal      float64 `json:"subtotal"`
}

// Request and Response DTOs

type LoginRequest struct {
	BoothID string `json:"booth_id"`
	PIN     string `json:"pin"`
}

type LoginResponse struct {
	Token   string   `json:"token"`
	Profile Profile  `json:"profile"`
	Booth   Booth    `json:"booth"`
}

type OpenShiftAuditItem struct {
	StockItemID      *string           `json:"stock_item_id,omitempty"`
	ItemName         string            `json:"item_name"`
	TrackingType     AuditTrackingType `json:"tracking_type"`
	MeasuredQuantity float64           `json:"measured_quantity"`
	Unit             string            `json:"unit"`
	PhotoURL         string            `json:"photo_url"`
}

type OpenShiftRequest struct {
	BoothID     string               `json:"booth_id"`
	CashierID   string               `json:"cashier_id"`
	ShiftNumber int                  `json:"shift_number"`
	OpeningCash float64              `json:"opening_cash"`
	AuditItems  []OpenShiftAuditItem `json:"audit_items"`
}

type CloseShiftRequest struct {
	ShiftID           string               `json:"shift_id"`
	ClosingCashActual float64              `json:"closing_cash_actual"`
	ClosingNotes      string               `json:"closing_notes,omitempty"`
	AuditItems        []OpenShiftAuditItem `json:"audit_items"`
}

type CheckoutItem struct {
	MenuID       string  `json:"menu_id"`
	Quantity     int     `json:"quantity"`
	PricePerUnit float64 `json:"price_per_unit"`
	Modifiers    string  `json:"modifiers,omitempty"`
}

type CheckoutRequest struct {
	BoothID        string         `json:"booth_id"`
	ShiftID        string         `json:"shift_id"`
	PaymentMethod  PaymentMethod  `json:"payment_method"` // cash or qris
	TotalAmount    float64        `json:"total_amount"`
	CashReceived   float64        `json:"cash_received,omitempty"`
	Items          []CheckoutItem `json:"items"`
}

type CheckoutResponse struct {
	TransactionID    string        `json:"transaction_id"`
	IdempotencyKey   string        `json:"idempotency_key"`
	PaymentMethod    PaymentMethod `json:"payment_method"`
	Status           PaymentStatus `json:"status"`
	TotalAmount      float64       `json:"total_amount"`
	Change           float64       `json:"change,omitempty"`
	QRISData         string        `json:"qris_data,omitempty"`
	XenditPaymentURL string        `json:"xendit_payment_url,omitempty"`
}

type SyncTransactionItem struct {
	IdempotencyKey   string        `json:"idempotency_key"`
	BoothID          string        `json:"booth_id"`
	ShiftID          string        `json:"shift_id"`
	CashierID        string        `json:"cashier_id"`
	PaymentMethod    PaymentMethod `json:"payment_method"`
	Status           PaymentStatus `json:"status"`
	TotalAmount      float64       `json:"total_amount"`
	OfflineCreatedAt time.Time     `json:"offline_created_at"`
	Items            []CheckoutItem `json:"items"`
}

type SyncTransactionsRequest struct {
	BoothID      string                `json:"booth_id"`
	Transactions []SyncTransactionItem `json:"transactions"`
}

type SyncTransactionsResponse struct {
	SyncedCount int      `json:"synced_count"`
	Skipped     int      `json:"skipped"` // Already exists via idempotency_key
	SyncedKeys  []string `json:"synced_keys"`
}

type XenditWebhookPayload struct {
	ID                 string  `json:"id"`
	ExternalID         string  `json:"external_id"` // Matches our IdempotencyKey
	Status             string  `json:"status"`      // PAID, EXPIRED
	Amount             float64 `json:"amount"`
	PaymentMethod      string  `json:"payment_method"`
	PaymentChannel     string  `json:"payment_channel"`
	PaidAt             string  `json:"paid_at"`
	CallbackVirtualAcc string  `json:"callback_virtual_account_id,omitempty"`
}
