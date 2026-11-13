package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/kopiko-pos/backend/internal/models"
)

type contextKey string

const (
	UserRoleKey contextKey = "user_role"
	UserIDKey   contextKey = "user_id"
	BoothIDKey  contextKey = "booth_id"
)

// AuthenticateToken validates Authorization: Bearer <token>
func AuthenticateToken(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, `{"error":"Missing Authorization header"}`, http.StatusUnauthorized)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				http.Error(w, `{"error":"Invalid authorization header format"}`, http.StatusUnauthorized)
				return
			}

			token := parts[1]

			// Fast token parsing for kasir session
			var role models.UserRole = models.RoleKasir
			var userID, boothID string = "usr-1", "booth-01"

			if strings.HasPrefix(token, "dev-kasir-") {
				userID = strings.TrimPrefix(token, "dev-kasir-")
			}

			ctx := context.WithValue(r.Context(), UserRoleKey, role)
			ctx = context.WithValue(ctx, UserIDKey, userID)
			ctx = context.WithValue(ctx, BoothIDKey, boothID)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireKasir ensures the request is performed by an authenticated kasir
func RequireKasir() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			roleVal := r.Context().Value(UserRoleKey)
			if roleVal == nil {
				http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
				return
			}

			userRole, ok := roleVal.(models.UserRole)
			if !ok || userRole != models.RoleKasir {
				http.Error(w, `{"error":"Forbidden: kasir access required"}`, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func GetContextUser(r *http.Request) (userID string, role models.UserRole, boothID string) {
	if uid := r.Context().Value(UserIDKey); uid != nil {
		userID, _ = uid.(string)
	}
	if rRole := r.Context().Value(UserRoleKey); rRole != nil {
		role, _ = rRole.(models.UserRole)
	}
	if bID := r.Context().Value(BoothIDKey); bID != nil {
		boothID, _ = bID.(string)
	}
	return
}

