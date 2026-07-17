package auth

import (
	"fmt"
	"net/smtp"
	"os"
	"strconv"
	"strings"

	"gopkg.in/gomail.v2"
)

// SMTPSender 发送邮件验证码
type SMTPSender struct {
	host string
	port int
	user string
	pass string
	from string
}

// NewSMTPSender 创建 SMTP 发送器
func NewSMTPSender(host string, port int, user, pass, from string) *SMTPSender {
	return &SMTPSender{
		host: host,
		port: port,
		user: user,
		pass: pass,
		from: from,
	}
}

// SendVerificationCode 发送验证码邮件
func (s *SMTPSender) SendVerificationCode(to, code string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", s.from)
	m.SetHeader("To", to)
	m.SetHeader("Subject", "系统架构师备考平台 - 登录验证码")
	m.SetBody("text/html", fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
			<h2>系统架构师备考平台</h2>
			<p>您好，您的登录验证码为：</p>
			<div style="font-size: 32px; font-weight: bold; color: #2d8cf0; letter-spacing: 8px; margin: 24px 0;">%s</div>
			<p>验证码 60 秒内有效，请勿泄露给他人。</p>
			<p style="color: #999; font-size: 12px;">如非本人操作，请忽略此邮件。</p>
		</div>
	`, code))
	d := gomail.NewDialer(s.host, s.port, s.user, s.pass)

	// Allow plaintext only when SMTP host is local (mailpit, localhost, *.local)
	// AND caller didn't explicitly opt out. Remote SMTP providers never get the bypass
	// unless the operator explicitly sets SMTP_ALLOW_PLAINTEXT=1.
	if allowPlaintext(s.host) {
		d.SSL = false
		d.Auth = plainAuthBypassTLS(s.host, s.user, s.pass)
	}

	return d.DialAndSend(m)
}

// allowPlaintext returns true when the SMTP host is recognized as a local
// dev/capture server (mailpit, localhost, *.local) OR when the operator has
// explicitly set SMTP_ALLOW_PLAINTEXT=1. Remote SMTP providers always return
// false unless the explicit override is set, so a leaked prod env file cannot
func allowPlaintext(host string) bool {
	if v := os.Getenv("SMTP_ALLOW_PLAINTEXT"); v != "" {
		return v == "1"
	}
	h := strings.ToLower(strings.TrimSpace(host))
	if h == "mailpit" || h == "localhost" || strings.HasSuffix(h, ".local") {
		return true
	}
	return false
}

// NewDefaultSMTPSenderFromEnv 示例（保持与 service 解耦）
func NewDefaultSMTPSenderFromEnv(host string, portStr string, user, pass, from string) (*SMTPSender, error) {
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return nil, fmt.Errorf("invalid smtp port: %w", err)
	}
	return NewSMTPSender(host, port, user, pass, from), nil
}

// plainAuthBypassTLS returns an smtp.Auth that sends PLAIN credentials
// without requiring TLS. Only safe for local dev (mailpit etc).
func plainAuthBypassTLS(host, user, pass string) smtp.Auth {
	// Custom PLAIN auth identity + username + password, bypassing Go's TLS gate
	return plainAuth{host: host, user: user, pass: pass}
}

type plainAuth struct {
	host string
	user string
	pass string
}

func (a plainAuth) Start(server *smtp.ServerInfo) (string, []byte, error) {
	resp := []byte("\x00" + a.user + "\x00" + a.pass)
	return "PLAIN", resp, nil
}

func (a plainAuth) Next(fromServer []byte, more bool) ([]byte, error) {
	// PLAIN is a single-round SASL mechanism; the server should not issue
	// a follow-up challenge. Return nil to avoid re-sending the credential.
	return nil, nil
}
