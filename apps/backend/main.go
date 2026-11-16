package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/kopiko-pos/backend/internal/config"
	"github.com/kopiko-pos/backend/internal/handlers"
	"github.com/kopiko-pos/backend/internal/middleware"
	"github.com/kopiko-pos/backend/internal/service"
)

func main() {
	cfg := config.Load()

	// 1. Core Domain Services (Xendit Dynamic QRIS)
	xenditSvc := service.NewXenditService(cfg.XenditSecretKey, cfg.XenditCallbackToken)

	// 2. HTTP Handlers (Fokus Kasir & POS Operasional)
	authHandler := handlers.NewAuthHandler()
	menuHandler := handlers.NewMenuHandler()
	shiftHandler := handlers.NewShiftHandler()
	txHandler := handlers.NewTransactionHandler(xenditSvc)
	webhookHandler := handlers.NewWebhookHandler(xenditSvc, txHandler)

	// 3. Middlewares
	authMiddleware := middleware.AuthenticateToken(cfg.SupabaseJWTSecret)
	requireKasir := middleware.RequireKasir()
	rateLimiter := middleware.NewRateLimiter(20, 5) // 20 tokens capacity, 5 refill/sec

	// 4. Router using Go 1.22+ Standard ServeMux
	mux := http.NewServeMux()

	// --- System & Status Dashboard ---
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		html := `<!DOCTYPE html>
<html>
<head>
    <title>Kopiko POS - Kasir Backend Service</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; }
        .card { max-width: 680px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); border: 1px solid #334155; }
        .badge { display: inline-block; background: #10b981; color: #022c22; font-weight: bold; padding: 4px 12px; border-radius: 999px; font-size: 13px; margin-bottom: 16px; }
        h1 { margin: 0 0 8px; font-size: 24px; color: #f8fafc; }
        p { color: #94a3b8; line-height: 1.6; margin: 0 0 24px; }
        .links { background: #0f172a; border-radius: 8px; padding: 16px; border: 1px solid #334155; margin-bottom: 24px; }
        .link-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; }
        .link-item:last-child { border-bottom: none; }
        a { color: #38bdf8; text-decoration: none; font-weight: 500; }
        a:hover { text-decoration: underline; }
        .pos-hint { background: #3b2818; border: 1px solid #78350f; border-radius: 8px; padding: 16px; color: #fed7aa; font-size: 14px; }
        code { background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #38bdf8; font-family: monospace; }
    </style>
</head>
<body>
    <div class="card">
        <span class="badge">● Kasir Backend Aktif (Go 1.22)</span>
        <h1>Kopiko POS - Backend Service Kasir</h1>
        <p>Layanan backend inti untuk operasional Kasir: Login Kasir, Buka/Tutup Shift dengan foto timbangan fisik, Checkout POS (QRIS/Tunai), dan Sinkronisasi Antrean Offline.</p>
        
        <div class="links">
            <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Endpoint API Kasir:</div>
            <div class="link-item">
                <span>Healthcheck Status</span>
                <a href="/health" target="_blank">/health</a>
            </div>
            <div class="link-item">
                <span>Katalog Menu Kasir</span>
                <a href="/api/v1/products" target="_blank">/api/v1/products</a>
            </div>
            <div class="link-item">
                <span>Buka / Tutup Shift & Audit Timbangan</span>
                <span style="color: #94a3b8;">/api/v1/shifts/open & /close</span>
            </div>
            <div class="link-item">
                <span>Checkout Transaksi POS</span>
                <span style="color: #94a3b8;">/api/v1/transactions</span>
            </div>
            <div class="link-item">
                <span>Sinkronisasi Transaksi Offline</span>
                <span style="color: #94a3b8;">/api/v1/transactions/sync</span>
            </div>
        </div>

        <div class="pos-hint">
            <strong>💡 Akses Antarmuka Tablet Kasir:</strong><br>
            Buka terminal dan jalankan: <code>npm run pos</code> (akan terbuka di port <code>:8081</code>).
        </div>
    </div>
</body>
</html>`
		_, _ = w.Write([]byte(html))
	})

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"healthy","service":"kopiko-kasir-backend"}`))
	})

	// --- 1. Menu Catalog untuk Tablet Kasir POS ---
	mux.HandleFunc("GET /api/v1/products", menuHandler.GetMenuCatalog)

	// --- 2. Autentikasi Kasir via PIN ---
	mux.Handle("POST /api/v1/auth/login", rateLimiter.Limit(http.HandlerFunc(authHandler.Login)))

	// --- 3. Operasional Shift Kasir & Audit Foto Timbangan ---
	mux.Handle("POST /api/v1/shifts/open", authMiddleware(requireKasir(http.HandlerFunc(shiftHandler.OpenShift))))
	mux.Handle("POST /api/v1/shifts/close", authMiddleware(requireKasir(http.HandlerFunc(shiftHandler.CloseShift))))

	// --- 4. Transaksi Kasir POS (Checkout & Sync Offline & QRIS Status) ---
	mux.Handle("POST /api/v1/transactions", authMiddleware(requireKasir(rateLimiter.Limit(http.HandlerFunc(txHandler.CreateTransaction)))))
	mux.Handle("POST /api/v1/transactions/sync", authMiddleware(requireKasir(http.HandlerFunc(txHandler.SyncTransactions))))
	mux.Handle("GET /api/v1/transactions/status", authMiddleware(requireKasir(http.HandlerFunc(txHandler.GetTransactionStatus))))
	mux.Handle("POST /api/v1/transactions/simulate-pay", authMiddleware(requireKasir(http.HandlerFunc(txHandler.SimulatePayment))))

	// --- 5. Payment Gateway Webhook (Xendit Dynamic QRIS) ---
	mux.HandleFunc("POST /api/v1/webhooks/xendit", webhookHandler.HandleXenditCallback)

	// Global Middleware Wrapping (CORS)
	handler := middleware.EnableCORS(mux)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("[Kopiko Kasir Backend] Server running on http://localhost%s (Environment: %s)\n", addr, cfg.Environment)
	log.Printf("[Kopiko Kasir Backend] Dedicated for Kasir POS, Shift Audit, and Offline Sync\n")

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("Server failed to start: %v\n", err)
	}
}
