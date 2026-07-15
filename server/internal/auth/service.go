package auth

import (
	"context"
	"crypto/rand"
	"fmt"
	"math/big"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type UserRepository interface {
	GetOrCreateUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserByID(ctx context.Context, id int) (*User, error)
}

// ReviewItemEnsurer creates review_items for a user when they first sign in.
type ReviewItemEnsurer interface {
	EnsureUserReviewItems(ctx context.Context, userID int) (int64, error)
}


// AuthService 认证业务逻辑
type AuthService struct {
	codeStore     *CodeStore
	smtpSender    *SMTPSender
	jwtSecret     []byte
	userRepo      UserRepository
	reviewEnsurer ReviewItemEnsurer
}

// NewAuthService 创建认证服务
func NewAuthService(
	codeStore *CodeStore,
	smtpSender *SMTPSender,
	jwtSecret string,
	userRepo UserRepository,
	reviewEnsurer ReviewItemEnsurer,
) *AuthService {
	return &AuthService{
		codeStore:     codeStore,
		smtpSender:    smtpSender,
		jwtSecret:     []byte(jwtSecret),
		userRepo:      userRepo,
		reviewEnsurer: reviewEnsurer,
	}
}


// SendCode 生成验证码并发送邮件
func (s *AuthService) SendCode(ctx context.Context, email string) error {
	code, err := generateRandomCode(6)
	if err != nil {
		return fmt.Errorf("generate code: %w", err)
	}

	s.codeStore.SetCode(email, code)

	if err := s.smtpSender.SendVerificationCode(email, code); err != nil {
		return fmt.Errorf("send email: %w", err)
	}
	return nil
}

// VerifyLogin 校验验证码，查询/创建用户，签发 JWT
func (s *AuthService) VerifyLogin(ctx context.Context, email, code string) (*AuthResponse, error) {
	if err := s.codeStore.VerifyCode(email, code); err != nil {
		return nil, err
	}

	user, err := s.userRepo.GetOrCreateUserByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("get or create user: %w", err)
	}

	// Ensure review_items exist for this user (idempotent).
	if _, err := s.reviewEnsurer.EnsureUserReviewItems(ctx, user.ID); err != nil {
		// Fail-soft: log but do not block sign-in.
		fmt.Printf("warning: ensure review items for user %d: %v\n", user.ID, err)
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	return &AuthResponse{
		User:  *user,
		Token: token,
	}, nil
}

// GetUserByID 通过 ID 查询用户
func (s *AuthService) GetUserByID(ctx context.Context, id int) (*User, error) {
	return s.userRepo.GetUserByID(ctx, id)
}

// generateToken 签发 JWT，包含 userID 和 email，7 天过期
func (s *AuthService) generateToken(user *User) (string, error) {
	claims := jwt.MapClaims{
		"userID": strconv.Itoa(user.ID),
		"email":  user.Email,
		"exp":    time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":    time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

// JWTSecret returns the JWT secret string for middleware use.
func (s *AuthService) JWTSecret() string {
	return string(s.jwtSecret)
}

// InspectCode 读取验证码（不删除），用于 dev 模式回显
func (s *AuthService) InspectCode(email string) (string, bool) {
	return s.codeStore.Inspect(email)
}

// generateRandomCode 生成 n 位随机数字验证码
func generateRandomCode(n int) (string, error) {
	const digits = "0123456789"
	code := make([]byte, n)
	for i := range n {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		if err != nil {
			return "", err
		}
		code[i] = digits[num.Int64()]
	}
	return string(code), nil
}
