package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/normanway/architect-prep/internal/db"
)

// BankQuestion represents a question from Zhang-986/ruankao-architect-practice bank.json
type BankQuestion struct {
	ID         string            `json:"id"`
	SourceType string            `json:"sourceType"` // real / mock
	Term       string            `json:"term"`      // e.g. "2024年上半年"
	Paper      string            `json:"paper"`
	QuestionNo int               `json:"questionNo"`
	Module     string            `json:"module"`   // e.g. "architecture"
	Knowledge  string            `json:"knowledge"` // e.g. "操作系统—进程同步与互斥"
	Difficulty string            `json:"difficulty"` // ★~★★★★★
	Stem       string            `json:"stem"`
	Options    map[string]string `json:"options"` // {A: "...", B: "...", ...}
	Answer     string            `json:"answer"`  // single letter
	Analysis   string            `json:"analysis"`
	SourceFile string            `json:"sourceFile"`
}

// BankData is the top-level structure of bank.json
type BankData struct {
	SchemaVersion int           `json:"schemaVersion"`
	Choices       []BankQuestion `json:"choices"`
}

// moduleToChapterID maps bank.json modules to chapter IDs.
// Returns 0 if no mapping (chapter_id will be NULL).
func moduleToChapterID(module string) int {
	// Chapter IDs are auto-increment starting from 1.
	// The seed creates chapters 1-20 in order.
	// We map by chapter_no, then need the actual DB id.
	// Since we don't have the DB id here, we return chapter_no
	// and the import function will look up the actual id.
	switch module {
	case "computer_foundation":
		return 2 // ch02 计算机系统基础知识
	case "software_engineering":
		return 5 // ch05 软件工程基础知识
	case "database":
		return 6 // ch06 数据库设计基础知识
	case "network":
		return 17 // ch17 通信系统架构设计
	case "security":
		return 18 // ch18 安全架构设计
	case "architecture":
		return 7 // ch07 系统架构设计基础知识 (primary, many questions span ch7-15)
	case "project_management":
		return 5 // ch05 软件工程（含项目管理）
	case "new_technology":
		return 11 // ch11 未来信息综合技术
	case "embedded":
		return 16 // ch16 嵌入式系统架构
	case "english", "legal_ip", "other":
		return 0 // no chapter association
	default:
		return 0
	}
}

var yearRE = regexp.MustCompile(`(\d{4})年`)
var halfRE = regexp.MustCompile(`(上半|下半)年`)

func parseYearHalf(term string) (int, string) {
	year := 0
	half := ""

	if m := yearRE.FindStringSubmatch(term); len(m) > 1 {
		fmt.Sscanf(m[1], "%d", &year)
	}

	if m := halfRE.FindStringSubmatch(term); len(m) > 1 {
		if strings.Contains(m[1], "上半") {
			half = "first"
		} else {
			half = "second"
		}
	}

	// Mock terms like "2026年5月 模拟卷1"
	if strings.Contains(term, "模拟") {
		half = "mock"
	}

	return year, half
}

func parseDifficulty(d string) int {
	return strings.Count(d, "★")
}

func main() {
	bankPath := flag.String("bank", "data/bank.json", "Path to bank.json")
	dbPath := flag.String("db", "", "SQLite database path (required)")
	flag.Parse()

	if *dbPath == "" {
		log.Fatal("--db is required")
	}

	// Read bank.json
	raw, err := os.ReadFile(*bankPath)
	if err != nil {
		log.Fatalf("read bank.json: %v", err)
	}

	var bank BankData
	if err := json.Unmarshal(raw, &bank); err != nil {
		log.Fatalf("unmarshal bank.json: %v", err)
	}

	fmt.Printf("Loaded %d choice questions from bank.json\n", len(bank.Choices))

	// Open DB
	database, err := db.NewDB(*dbPath)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer database.Close()

	// Build chapter_no -> id map
	chapterMap := make(map[int]int) // chapter_no -> db id
	rows, err := database.Query("SELECT id, chapter_no FROM chapters")
	if err != nil {
		log.Fatalf("query chapters: %v", err)
	}
	for rows.Next() {
		var id, chapterNo int
		rows.Scan(&id, &chapterNo)
		chapterMap[chapterNo] = id
	}
	rows.Close()

	// Check existing questions to avoid duplicates
	existingCount := 0
	database.QueryRow("SELECT COUNT(*) FROM questions").Scan(&existingCount)
	fmt.Printf("Existing questions in DB: %d\n", existingCount)

	// Build a set of existing content prefixes for dedup
	existingPrefixes := make(map[string]bool)
	if existingCount > 0 {
		exRows, _ := database.Query("SELECT content FROM questions")
		for exRows.Next() {
			var content string
			exRows.Scan(&content)
			prefix := content
			if len(prefix) > 100 {
				prefix = prefix[:100]
			}
			existingPrefixes[prefix] = true
		}
		exRows.Close()
	}

	// Import questions
	imported := 0
	skipped := 0
	stats := map[string]int{} // by module

	for _, q := range bank.Choices {
		// Build options JSON array
		optKeys := []string{"A", "B", "C", "D"}
		var options []string
		for _, k := range optKeys {
			if v, ok := q.Options[k]; ok {
				options = append(options, fmt.Sprintf("%s. %s", k, v))
			}
		}
		optionsJSON, _ := json.Marshal(options)
		answerKeysJSON, _ := json.Marshal([]string{q.Answer})

		year, half := parseYearHalf(q.Term)
		difficulty := parseDifficulty(q.Difficulty)

		examType := "comprehensive"
		if q.SourceType == "mock" {
			examType = "mock"
		}

		// Map module to chapter
		chapterNo := moduleToChapterID(q.Module)
		var chapterID *int
		if chapterNo > 0 {
			if id, ok := chapterMap[chapterNo]; ok {
				chapterID = &id
			}
		}

		// Dedup check
		prefix := q.Stem
		if len(prefix) > 100 {
			prefix = prefix[:100]
		}
		if existingPrefixes[prefix] {
			skipped++
			continue
		}
		existingPrefixes[prefix] = true

		// Insert
		var chapterArg interface{}
		if chapterID != nil {
			chapterArg = *chapterID
		} else {
			chapterArg = nil
		}

		_, err := database.Exec(
			`INSERT INTO questions (chapter_id, year, half, exam_type, question_type, content, options, answer_keys, explanation, source, difficulty)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			chapterArg,
			year,
			half,
			examType,
			"single",
			q.Stem,
			string(optionsJSON),
			string(answerKeysJSON),
			q.Analysis,
			q.Knowledge,
			difficulty,
		)
		if err != nil {
			log.Printf("insert question %s: %v", q.ID, err)
			skipped++
			continue
		}

		imported++
		stats[q.Module]++
	}

	fmt.Printf("\nImport complete: %d imported, %d skipped (duplicates/errors)\n", imported, skipped)
	fmt.Println("\nBy module:")
	for k, v := range stats {
		fmt.Printf("  %s: %d\n", k, v)
	}

	// Verify total
	var total int
	database.QueryRow("SELECT COUNT(*) FROM questions").Scan(&total)
	fmt.Printf("\nTotal questions in DB: %d\n", total)

	// Print by year
	fmt.Println("\nBy year:")
	yearRows, _ := database.Query("SELECT year, COUNT(*) FROM questions GROUP BY year ORDER BY year")
	for yearRows.Next() {
		var y, c int
		yearRows.Scan(&y, &c)
		fmt.Printf("  %d: %d\n", y, c)
	}
	yearRows.Close()

	absPath, _ := filepath.Abs(*dbPath)
	fmt.Printf("\nDatabase: %s\n", absPath)
}
