package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/kopiko-pos/backend/internal/models"
)

type AuthHandler struct{}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	if req.PIN == "" {
		http.Error(w, `{"error":"PIN is required"}`, http.StatusBadRequest)
		return
	}

	// Validate PIN against demo / configured cashiers
	var profile models.Profile
	var token string

	if req.PIN == "1234" {
		profile = models.Profile{
			ID:       "usr-1",
			Role:     models.RoleKasir,
			FullName: "Alex Martins (Kasir Shift 1)",
		}
		token = "dev-kasir-usr-1"
	} else if req.PIN == "2345" {
		profile = models.Profile{
			ID:       "usr-2",
			Role:     models.RoleKasir,
			FullName: "Siti Rahma (Kasir Shift 2)",
		}
		token = "dev-kasir-usr-2"
	} else {
		http.Error(w, `{"error":"PIN tidak valid"}`, http.StatusUnauthorized)
		return
	}

	boothID := req.BoothID
	if boothID == "" {
		boothID = "booth-01"
	}
	profile.BoothID = &boothID

	resp := models.LoginResponse{
		Token:   token,
		Profile: profile,
		Booth: models.Booth{
			ID:       boothID,
			Code:     "KPK-BDG-001",
			Name:     "Booth Mall Senayan #01",
			Region:   "Jakarta Pusat",
			Address:  "Jl. Asia Afrika No. 8, Gelora, Tanah Abang",
			Latitude: -6.2255,
			Longitude: 106.7997,
			IsActive: true,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

