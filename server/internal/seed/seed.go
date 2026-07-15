package seed

import (
	"context"
	"database/sql"
	"embed"
	"encoding/json"
	"fmt"
	"log"
	"path/filepath"
	"regexp"
	"strings"
)

// markdownFS embeds all chapter markdown files at compile time so the seed
// pipeline is independent of the process working directory.
//
//go:embed markdown/*.md
var markdownFS embed.FS

// chapterMeta is the single source of truth for chapter titles and summaries.
// Knowledge point bodies come from internal/seed/markdown/chXX.md (one section
// per knowledge point). This table intentionally holds no body text.
var chapterMeta = []struct {
	No      int
	Title   string
	Summary string
}{
	{1, "绪论", "系统架构基本概念、架构设计师职责与能力要求"},
	{2, "计算机系统基础知识", "计算机硬件、操作系统、网络、嵌入式系统、系统性能"},
	{3, "信息系统基础知识", "信息系统分类：TPS/MIS/DSS/ES/OAS/ERP及典型架构模型"},
	{4, "信息安全技术基础知识", "加密解密、密钥管理、访问控制、数字签名、抗攻击技术"},
	{5, "软件工程基础知识", "软件过程模型、需求工程、系统分析与设计、软件测试、项目管理"},
	{6, "数据库设计基础知识", "关系数据库、数据库设计步骤、数据交互、NoSQL"},
	{7, "系统架构设计基础知识", "架构设计概念、ABSD方法、架构风格、软件架构文档化与复用"},
	{8, "系统质量属性与架构评估", "质量属性、架构评估方法ATAM/SAAM、敏感点与权衡点"},
	{9, "软件可靠性基础知识", "可靠性定义、可靠性分析、可靠性设计、可靠性测试与评估"},
	{10, "软件架构的演化和维护", "演化定义、演化原则、演化过程、架构维护"},
	{11, "未来信息综合技术", "信息物理系统CPS、人工智能、边缘计算、数字孪生"},
	{12, "信息系统架构设计理论与实践", "信息系统架构风格、分类、企业总体框架、ADM方法"},
	{13, "层次式架构设计理论与实践", "表现层、中间层、数据访问层、数据架构、物联网层次架构"},
	{14, "云原生架构设计理论与实践", "容器、微服务、无服务器、服务网格"},
	{15, "面向服务架构设计理论与实践", "SOA概述、关键技术、微服务"},
	{16, "嵌入式系统架构设计理论与实践", "嵌入式硬件、操作系统、数据库、中间件、开发环境"},
	{17, "通信系统架构设计理论与实践", "网络架构、组网技术、SDN、网络安全"},
	{18, "安全架构设计理论与实践", "安全模型、WPDRRC、网络安全体系、数据库安全"},
	{19, "大数据架构设计理论与实践", "Lambda架构、Kappa架构、大数据处理"},
	{20, "系统架构设计师论文写作要点", "论文格式、写作方法、摘要与正文"},
}

// Run inserts 20 chapters + knowledge points (from markdown), seed questions and
// knowledge cards into the database.
//
// Markdown files at internal/seed/markdown/chXX.md are the single source of
// truth for knowledge point content; one section per knowledge point.
// The database must already be open; Run does not open or close it.
func Run(database *sql.DB) error {
	ctx := context.Background()

	chapterCount, pointCount := 0, 0

	for _, ch := range chapterMeta {
		res, err := database.ExecContext(ctx,
			`INSERT INTO chapters (chapter_no, title, summary) VALUES (?, ?, ?)`,
			ch.No, ch.Title, ch.Summary)
		if err != nil {
			return fmt.Errorf("insert chapter %d: %w", ch.No, err)
		}

		chapterID, _ := res.LastInsertId()

		mdPath := filepath.Join("internal", "seed", "markdown", fmt.Sprintf("ch%02d.md", ch.No))
		mdPoints, mdErr := loadMarkdownKnowledgePoints(mdPath)
		if mdErr != nil {
			return fmt.Errorf("load markdown for chapter %d: %w", ch.No, mdErr)
		}

		for i, body := range mdPoints {
			_, err := database.ExecContext(ctx,
				`INSERT INTO knowledge_points (chapter_id, title, content, sort_order) VALUES (?, ?, ?, ?)`,
				chapterID, extractHeading(body), body, i)
			if err != nil {
				return fmt.Errorf("insert knowledge point %d in chapter %d: %w", i, ch.No, err)
			}
			pointCount++
		}
		chapterCount++
	}
	log.Printf("seed complete: %d chapters, %d knowledge points inserted", chapterCount, pointCount)

	// Insert test user for development
	_, _ = database.ExecContext(ctx,
		`INSERT OR IGNORE INTO users (id, email, nickname) VALUES (1, 'test@architect.dev', '测试用户')`)

	// Insert seed questions
	questionCount := 0
	for _, q := range Questions {
		optionsJSON, _ := json.Marshal(q.Options)
		answerKeysJSON, _ := json.Marshal(q.AnswerKeys)
		_, err := database.ExecContext(ctx,
			`INSERT INTO questions (chapter_id, exam_type, question_type, content, options, answer_keys, explanation, source, difficulty)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			q.ChapterID, q.ExamType, q.QuestionType, q.Content,
			string(optionsJSON), string(answerKeysJSON),
			q.Explanation, q.Source, q.Difficulty)
		if err != nil {
			return fmt.Errorf("insert question: %w", err)
		}
		questionCount++
	}
	log.Printf("seed complete: %d questions inserted", questionCount)

	cardCount := 0
	for _, card := range KnowledgeCards {
		var chapterID int
		err := database.QueryRowContext(ctx,
			`SELECT id FROM chapters WHERE chapter_no = ?`, card.ChapterNo).Scan(&chapterID)
		if err != nil {
			log.Printf("warning: chapter %d not found for knowledge card: %v", card.ChapterNo, err)
			continue
		}
		var pointID int
		err = database.QueryRowContext(ctx,
			`SELECT id FROM knowledge_points WHERE chapter_id = ? ORDER BY sort_order LIMIT 1`, chapterID).Scan(&pointID)
		if err != nil {
			log.Printf("warning: no knowledge points for chapter %d: %v", chapterID, err)
			continue
		}
		source := card.Source
		if source == "" {
			source = fmt.Sprintf("ch%d", card.ChapterNo)
		}
		_, err = database.ExecContext(ctx,
			`INSERT INTO knowledge_cards (id, knowledge_point_id, chapter_id, front, back, source, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
			cardCount+1, pointID, chapterID, card.Front, card.Back, source, cardCount)
		if err != nil {
			log.Printf("warning: insert knowledge card: %v", err)
			continue
		}
		cardCount++
	}
	log.Printf("seed complete: %d knowledge cards inserted", cardCount)

	// P2 fix: ensure all users have a review_item (item_type='knowledge_card', state=Learning)
	// for every knowledge_card, so the "今日复习" page can show knowledge cards.
	reviewCount, err := database.ExecContext(ctx, `
		INSERT OR IGNORE INTO review_items (user_id, item_type, item_id, state, step, due, reps, lapses)
		SELECT u.id, 'knowledge_card', kc.id, 1, 0, datetime('now'), 0, 0
		FROM users u, knowledge_cards kc
	`)
	if err != nil {
		log.Printf("warning: seed review items for knowledge cards: %v", err)
	} else {
		n, _ := reviewCount.RowsAffected()
		log.Printf("seed complete: %d knowledge card review items created", n)
	}

	// P2 fix: also migrate any pre-existing wrong_questions into review_items.
	migCount, err := database.ExecContext(ctx, `
		INSERT OR IGNORE INTO review_items (user_id, item_type, item_id, state, step, due, reps, lapses)
		SELECT user_id, 'wrong_question', question_id, 1, 0, datetime('now'), 0, 0
		FROM wrong_questions
	`)
	if err != nil {
		log.Printf("warning: migrate wrong_questions: %v", err)
	} else {
		n, _ := migCount.RowsAffected()
		if n > 0 {
			log.Printf("seed complete: %d wrong_questions migrated to review_items", n)
		}
	}
	return nil
}

// extractHeading reads the first "## Title" line from a markdown section body.
func extractHeading(section string) string {
	first, _, _ := strings.Cut(section, "\n")
	for _, line := range strings.Split(first, "\n") {
		if m := headingRE.FindStringSubmatch(line); m != nil {
			return strings.TrimSpace(m[1])
		}
	}
	return ""
}

// loadMarkdownKnowledgePoints reads a markdown file and splits it into knowledge points.
// Each knowledge point starts with "## Title" and is separated by "---".
// Returns a slice of markdown content strings, one per knowledge point (in order).
var headingRE = regexp.MustCompile(`^##\s+(.+)$`)
var separatorRE = regexp.MustCompile(`(?m)^---\s*$`)

func loadMarkdownKnowledgePoints(path string) ([]string, error) {
	// The seed pipeline runs at server startup; the chapter markdown is
	// embedded into the binary, so this read is cwd-independent.
	relPath := path
	if strings.HasPrefix(relPath, "internal/seed/") {
		relPath = strings.TrimPrefix(relPath, "internal/seed/")
	}
	data, err := markdownFS.ReadFile(relPath)
	if err != nil {
		return nil, err
	}
	text := string(data)
	sections := separatorRE.Split(text, -1)
	var points []string
	for _, section := range sections {
		section = strings.TrimSpace(section)
		if section == "" {
			continue
		}
		if strings.HasPrefix(section, "## 参考文献") {
			continue
		}
		lines := strings.Split(section, "\n")
		if len(lines) > 0 && headingRE.MatchString(strings.TrimSpace(lines[0])) {
			points = append(points, section)
		}
	}
	return points, nil
}
