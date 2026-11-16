package config

import (
	"os"
)

type Config struct {
	Port                string
	Environment         string
	DatabaseURL         string
	SupabaseURL         string
	SupabaseKey         string
	SupabaseJWTSecret   string
	SupabaseBucket      string
	XenditSecretKey     string
	XenditCallbackToken string
	RedisURL            string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		env = "development"
	}

	callbackToken := os.Getenv("XENDIT_CALLBACK_TOKEN")
	if callbackToken == "" {
		callbackToken = "kopiko_xendit_webhook_token_secure"
	}

	return &Config{
		Port:                port,
		Environment:         env,
		DatabaseURL:         os.Getenv("DATABASE_URL"),
		SupabaseURL:         os.Getenv("SUPABASE_URL"),
		SupabaseKey:         os.Getenv("SUPABASE_KEY"),
		SupabaseJWTSecret:   os.Getenv("SUPABASE_JWT_SECRET"),
		SupabaseBucket:      os.Getenv("SUPABASE_STORAGE_BUCKET"),
		XenditSecretKey:     os.Getenv("XENDIT_SECRET_KEY"),
		XenditCallbackToken: callbackToken,
		RedisURL:            os.Getenv("REDIS_URL"),
	}
}

