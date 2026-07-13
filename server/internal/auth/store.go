package auth

import (
	"fmt"
	"sync"
	"time"
)

// ErrCodeNotFound 验证码不存在或已过期
var ErrCodeNotFound = fmt.Errorf("verification code not found or expired")

// ErrCodeMismatch 验证码错误
var ErrCodeMismatch = fmt.Errorf("verification code mismatch")

// codeWithExpiry 保存验证码和过期时间
type codeWithExpiry struct {
	code    string
	expired time.Time
}

// CodeStore 内存验证码存储，带 TTL
type CodeStore struct {
	mu    sync.RWMutex
	codes map[string]codeWithExpiry
}

// NewCodeStore 创建新的验证码存储
func NewCodeStore() *CodeStore {
	return &CodeStore{
		codes: make(map[string]codeWithExpiry),
	}
}

// SetCode 保存验证码，默认 60 秒过期
func (s *CodeStore) SetCode(email, code string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.codes[email] = codeWithExpiry{
		code:    code,
		expired: time.Now().Add(60 * time.Second),
	}
}

// VerifyCode 校验验证码，正确后删除；过期或不存在则返回错误
func (s *CodeStore) VerifyCode(email, code string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	v, ok := s.codes[email]
	if !ok {
		return ErrCodeNotFound
	}
	if time.Now().After(v.expired) {
		delete(s.codes, email)
		return ErrCodeNotFound
	}
	if v.code != code {
		return ErrCodeMismatch
	}
	delete(s.codes, email)
	return nil
}

// cleanupExpired 清理过期验证码
func (s *CodeStore) cleanupExpired() {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	for email, v := range s.codes {
		if now.After(v.expired) {
			delete(s.codes, email)
		}
	}
}

// StartCleanup 启动定时清理过期验证码的 goroutine
func (s *CodeStore) StartCleanup(interval time.Duration) *time.Ticker {
	ticker := time.NewTicker(interval)
	go func() {
		for range ticker.C {
			s.cleanupExpired()
		}
	}()
	return ticker
}
