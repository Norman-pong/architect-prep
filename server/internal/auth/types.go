package auth

// SendCodeRequest 发送验证码请求
type SendCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// VerifyLoginRequest 验证码登录请求
type VerifyLoginRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required,len=6"`
}

// User 用户信息
type User struct {
	ID       int    `json:"id"`
	Nickname string `json:"nickname"`
	Email    string `json:"email"`
}

// AuthResponse 认证响应
type AuthResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}
