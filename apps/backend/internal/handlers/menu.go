package handlers

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/kopiko-pos/backend/internal/models"
)

type MenuHandler struct {
	mu   sync.RWMutex
	menu []models.MenuItem
}

func NewMenuHandler() *MenuHandler {
	return &MenuHandler{
		menu: []models.MenuItem{
			{
				ID:          "prod-1",
				Name:        "Kopiko Aren Latte",
				SKU:         "KPK-LTT-001",
				Description: "Espresso Kopiko pilihan dipadukan dengan susu segar dan manis alami gula aren murni.",
				Price:       28000,
				ImageURL:    "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600",
				IsActive:    true,
			},
			{
				ID:          "prod-2",
				Name:        "Kopiko Americano",
				SKU:         "KPK-AME-002",
				Description: "Double espresso shot dengan air murni, cita rasa kopi hitam mantap tanpa ampas.",
				Price:       22000,
				ImageURL:    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600",
				IsActive:    true,
			},
			{
				ID:          "prod-3",
				Name:        "Kopiko Caramel Macchiato",
				SKU:         "KPK-CRM-003",
				Description: "Kombinasi vanila, steamed milk, espresso dan saus karamel lezat di atasnya.",
				Price:       32000,
				ImageURL:    "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600",
				IsActive:    true,
			},
			{
				ID:          "prod-4",
				Name:        "Kopiko Mochaccino",
				SKU:         "KPK-MCH-004",
				Description: "Paduan espresso kaya rasa dengan dark cokelat Belgia dan susu creamy.",
				Price:       30000,
				ImageURL:    "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600",
				IsActive:    true,
			},
		},
	}
}

func (h *MenuHandler) GetMenuCatalog(w http.ResponseWriter, r *http.Request) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(h.menu)
}

