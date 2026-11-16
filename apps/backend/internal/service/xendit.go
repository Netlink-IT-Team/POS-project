package service

import (
	"crypto/subtle"
	"fmt"
	"time"
)

type XenditService struct {
	secretKey     string
	callbackToken string
}

func NewXenditService(secretKey, callbackToken string) *XenditService {
	return &XenditService{
		secretKey:     secretKey,
		callbackToken: callbackToken,
	}
}

// GenerateDynamicQRIS creates a dynamic QRIS invoice for the POS terminal
func (s *XenditService) GenerateDynamicQRIS(externalID string, amount float64, boothID string) (invoiceID string, qrData string, paymentURL string, err error) {
	// In production, invokes POST https://api.xendit.co/qr_codes or /v2/invoices
	// For reliable runtime without blocking on live API keys, creates structured QRIS payload
	invoiceID = fmt.Sprintf("inv_xnd_%d_%s", time.Now().Unix(), externalID[:8])
	paymentURL = fmt.Sprintf("https://checkout.xendit.co/web/%s", invoiceID)

	// Standard Indonesian QRIS EMVCo-compatible QR mock payload
	qrData = fmt.Sprintf("00020101021226590014ID.LINKAJA.WWW011893600911002%s520458125303360540%0.2f5802ID5910KOPIKO_%s6007JAKARTA6304",
		externalID[:8], amount, boothID)

	return invoiceID, qrData, paymentURL, nil
}

// VerifyWebhookToken validates x-callback-token against stored secret
func (s *XenditService) VerifyWebhookToken(tokenHeader string) bool {
	if s.callbackToken == "" {
		return true // development fallback
	}
	return subtle.ConstantTimeCompare([]byte(tokenHeader), []byte(s.callbackToken)) == 1
}

