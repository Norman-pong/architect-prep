package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/normanway/architect-prep/internal/db"
)

// ParsedQuestion 解析后的题目中间格式
type ParsedQuestion struct {
	Number       int      `json:"number"`
	Content      string   `json:"content"`
	Options      []string `json:"options"`
	AnswerKeys   []string `json:"answer_keys"`
	Explanation  string   `json:"explanation"`
	Year         int      `json:"year"`
	Half         string   `json:"half"` // first / second
	ExamType     string   `json:"exam_type"`     // comprehensive
	QuestionType string   `json:"question_type"` // single / multiple
}

// 题号正则: ### 第N题
var questionNumRE = regexp.MustCompile(`^###\s*第\s*(\d+)\s*题`)

// 选项正则: - A. xxx 或 - A、 xxx
var optionRE = regexp.MustCompile(`^[-*]\s*([A-Z])[．.、)]?\s*(.+)`)

// 答案正则: **答案**: B 或 **答案**: B、D
var answerRE = regexp.MustCompile(`\*\*答案\*\*[:：]\s*(.+)`)

// 解析正则: **解析**: xxx
var explanationRE = regexp.MustCompile(`\*\*解析\*\*[:：]\s*(.+)`)

// 选项组标题: **选项（第一空）**: 或 **选项**:
var optionGroupRE = regexp.MustCompile(`\*\*选项`)

// 题目前缀正则
var contentPrefixRE = regexp.MustCompile(`^\*\*(?:题目|题干)\*\*[:：]\s*`)

func main() {
	dir := flag.String("dir", "data/questions", "Markdown 题库目录")
	dbPath := flag.String("db", "", "SQLite 数据库路径（留空则只输出 JSON 不导入）")
	flag.Parse()

	files, err := os.ReadDir(*dir)
	if err != nil {
		fmt.Fprintf(os.Stderr, "read dir: %v\n", err)
		os.Exit(1)
	}

	var allQuestions []ParsedQuestion

	for _, f := range files {
		if !strings.HasSuffix(f.Name(), ".md") {
			continue
		}

		// 解析文件名提取 year 和 half
		// 格式: 2025_second_comprehensive.md
		parts := strings.Split(strings.TrimSuffix(f.Name(), ".md"), "_")
		if len(parts) < 3 {
			continue
		}
		year, _ := strconv.Atoi(parts[0])
		half := parts[1] // first / second

		content, err := os.ReadFile(filepath.Join(*dir, f.Name()))
		if err != nil {
			fmt.Fprintf(os.Stderr, "read file %s: %v\n", f.Name(), err)
			continue
		}

		questions := parseMarkdown(string(content), year, half)
		// 过滤掉无答案或无选项的题目
		valid := filterValid(questions)
		allQuestions = append(allQuestions, valid...)
		fmt.Printf("%s: parsed %d, valid %d\n", f.Name(), len(questions), len(valid))
	}

	// 输出 JSON
	output, _ := json.MarshalIndent(allQuestions, "", "  ")
	outputPath := filepath.Join(*dir, "parsed_questions.json")
	if err := os.WriteFile(outputPath, output, 0644); err != nil {
		fmt.Fprintf(os.Stderr, "write output: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("\ntotal: %d valid questions -> %s\n", len(allQuestions), outputPath)

	// 导入数据库
	if *dbPath != "" {
		if err := importToDB(*dbPath, allQuestions); err != nil {
			fmt.Fprintf(os.Stderr, "import to db: %v\n", err)
			os.Exit(1)
		}
	}
}

// filterValid 过滤掉无答案或无选项的题目
func filterValid(questions []ParsedQuestion) []ParsedQuestion {
	var valid []ParsedQuestion
	for _, q := range questions {
		if len(q.AnswerKeys) == 0 || len(q.Options) == 0 || q.Content == "" {
			continue
		}
		valid = append(valid, q)
	}
	return valid
}

// importToDB 将解析的题目导入 SQLite questions 表
func importToDB(dbPath string, questions []ParsedQuestion) error {
	database, err := db.NewDB(dbPath)
	if err != nil {
		return fmt.Errorf("connect database: %w", err)
	}
	defer database.Close()

	ctx := context.Background()
	count := 0

	for _, q := range questions {
		optionsJSON, _ := json.Marshal(q.Options)
		answerKeysJSON, _ := json.Marshal(q.AnswerKeys)

		// exam_type / question_type 存为可空字符串
		examType := q.ExamType
		questionType := q.QuestionType
		explanation := q.Explanation
		source := fmt.Sprintf("exam-%d-%s", q.Year, q.Half)
		difficulty := 2 // 默认中等难度

		// year 和 half
		_, err := database.ExecContext(ctx,
			`INSERT INTO questions (chapter_id, year, half, exam_type, question_type, content, options, answer_keys, explanation, source, difficulty)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		nil, // chapter_id: NULL 表示未关联章节
			q.Year, q.Half, examType, questionType, q.Content,
			string(optionsJSON), string(answerKeysJSON),
			explanation, source, difficulty)
		if err != nil {
			return fmt.Errorf("insert question (year=%d no=%d): %w", q.Year, q.Number, err)
		}
		count++
	}

	log.Printf("imported %d questions into %s", count, dbPath)
	return nil
}

func parseMarkdown(text string, year int, half string) []ParsedQuestion {
	lines := strings.Split(text, "\n")
	var questions []ParsedQuestion

	var current *ParsedQuestion
	var collectingField string // "content" / "options" / "explanation"
	var optionGroupCount int   // 多空题的选项组计数
	var currentOptions []string

	flushCurrent := func() {
		if current == nil {
			return
		}
		if len(currentOptions) > 0 && len(current.Options) == 0 {
			current.Options = currentOptions
		}
		current.QuestionType = determineQuestionType(current.AnswerKeys)
		current.Content = cleanContent(current.Content)
		questions = append(questions, *current)
		current = nil
		collectingField = ""
	}

	for i := 0; i < len(lines); i++ {
		line := lines[i]
		trimmed := strings.TrimSpace(line)

		// 题号匹配
		if matches := questionNumRE.FindStringSubmatch(trimmed); matches != nil {
			flushCurrent()

			num, _ := strconv.Atoi(matches[1])
			current = &ParsedQuestion{
				Number:   num,
				Year:     year,
				Half:     half,
				ExamType: "comprehensive",
			}
			collectingField = "content"
			optionGroupCount = 0
			currentOptions = nil
			continue
		}

		if current == nil {
			continue
		}

		// 答案匹配
		if matches := answerRE.FindStringSubmatch(trimmed); matches != nil {
			rawAnswer := strings.TrimSpace(matches[1])
			current.AnswerKeys = parseAnswerKeys(rawAnswer)
			collectingField = ""
			continue
		}

		// 解析匹配
		if matches := explanationRE.FindStringSubmatch(trimmed); matches != nil {
			current.Explanation = strings.TrimSpace(matches[1])
			collectingField = "explanation"
			continue
		}

		// 选项组标题 (**选项**: 或 **选项（第一空）**:)
		if optionGroupRE.MatchString(trimmed) {
			if optionGroupCount > 0 && len(currentOptions) > 0 {
				// 多空题：合并所有选项组
				current.Options = append(current.Options, currentOptions...)
			}
			optionGroupCount++
			collectingField = "options"
			currentOptions = nil
			continue
		}

		// 选项匹配
		if matches := optionRE.FindStringSubmatch(trimmed); matches != nil {
			opt := fmt.Sprintf("%s. %s", matches[1], strings.TrimSpace(matches[2]))
			currentOptions = append(currentOptions, opt)
			collectingField = "options"
			continue
		}

		// 分隔线表示题目结束
		if trimmed == "---" {
			flushCurrent()
			continue
		}

		// 收集内容
		if collectingField == "content" && trimmed != "" {
			if current.Content != "" {
				current.Content += "\n"
			}
			current.Content += trimmed
		} else if collectingField == "explanation" && trimmed != "" {
			if current.Explanation != "" {
				current.Explanation += "\n"
			}
			current.Explanation += trimmed
		}
	}

	flushCurrent()

	return questions
}

// cleanContent 清理题干内容的常见前缀和噪声
func cleanContent(s string) string {
	s = strings.TrimSpace(s)
	s = contentPrefixRE.ReplaceAllString(s, "")
	return s
}

// parseAnswerKeys 解析答案字符串，如 "B" / "B、D" / "B,D"
func parseAnswerKeys(raw string) []string {
	// 清理常见噪声
	raw = strings.TrimSpace(raw)
	// 移除括号和空格
	raw = strings.ReplaceAll(raw, "（", "")
	raw = strings.ReplaceAll(raw, "）", "")
	raw = strings.ReplaceAll(raw, "(", "")
	raw = strings.ReplaceAll(raw, ")", "")

	// 按分隔符切分
	parts := regexp.MustCompile(`[,，、\s]+`).Split(raw, -1)

	var keys []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if len(p) == 1 && p[0] >= 'A' && p[0] <= 'Z' {
			keys = append(keys, p)
		}
	}
	return keys
}

// determineQuestionType 根据答案数量判断题型
func determineQuestionType(answerKeys []string) string {
	if len(answerKeys) > 1 {
		return "multiple"
	}
	return "single"
}
