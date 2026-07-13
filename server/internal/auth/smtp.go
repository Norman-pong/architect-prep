package auth

import (
	"fmt"
	"strconv"

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
	return d.DialAndSend(m)
}

// NewDefaultSMTPSenderFromEnv 示例（保持与 service 解耦）
func NewDefaultSMTPSenderFromEnv(host string, portStr string, user, pass, from string) (*SMTPSender, error) {
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return nil, fmt.Errorf("invalid smtp port: %w", err)
	}
	return NewSMTPSender(host, port, user, pass, from), nil
}
