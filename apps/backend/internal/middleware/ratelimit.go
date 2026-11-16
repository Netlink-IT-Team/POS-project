package middleware

import (
	"net/http"
	"sync"
	"time"
)

type clientBucket struct {
	tokens     float64
	lastRefill time.Time
}

type RateLimiter struct {
	mu       sync.Mutex
	clients  map[string]*clientBucket
	capacity float64
	rate     float64 // tokens per second
}

func NewRateLimiter(capacity float64, refillRatePerSec float64) *RateLimiter {
	return &RateLimiter{
		clients:  make(map[string]*clientBucket),
		capacity: capacity,
		rate:     refillRatePerSec,
	}
}

func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			ip = forwarded
		}

		rl.mu.Lock()
		b, exists := rl.clients[ip]
		now := time.Now()

		if !exists {
			rl.clients[ip] = &clientBucket{
				tokens:     rl.capacity - 1,
				lastRefill: now,
			}
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		// Refill tokens based on elapsed duration
		elapsed := now.Sub(b.lastRefill).Seconds()
		b.tokens += elapsed * rl.rate
		if b.tokens > rl.capacity {
			b.tokens = rl.capacity
		}
		b.lastRefill = now

		if b.tokens >= 1 {
			b.tokens -= 1
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
			return
		}

		rl.mu.Unlock()
		w.Header().Set("Retry-After", "1")
		http.Error(w, `{"error":"Too many requests. Please slow down."}`, http.StatusTooManyRequests)
	})
}

