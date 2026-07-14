package seed

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"
)

// BankQuestion represents a question from Zhang-986/ruankao-architect-practice bank.json
type BankQuestion struct {
	ID         string            `json:"id"`
	SourceType string            `json:"sourceType"`
	Term       string            `json:"term"`
	Module     string            `json:"module"`
	Knowledge  string            `json:"knowledge"`
	Difficulty string            `json:"difficulty"`
	Stem       string            `json:"stem"`
	Options    map[string]string `json:"options"`
	Answer     string            `json:"answer"`
	Analysis   string            `json:"analysis"`
}

// BankData is the top-level structure of bank.json
type BankData struct {
	Choices []BankQuestion `json:"choices"`
}

// moduleToChapterNo maps bank.json modules to chapter numbers.
func moduleToChapterNo(module string) int {
	switch module {
	case "computer_foundation":
		return 2
	case "software_engineering", "project_management":
		return 5
	case "database":
		return 6
	case "network":
		return 17
	case "security":
		return 18
	case "architecture":
		return 7
	case "new_technology":
		return 11
	case "embedded":
		return 16
	default:
		return 0
	}
}

// ImportBank imports questions from bank.json into the database.
// It skips questions whose content prefix (first 100 chars) already exists.
func ImportBank(ctx context.Context, database *sql.DB, bankPath string) (int, error) {
	raw, err := os.ReadFile(bankPath)
	if err != nil {
		return 0, fmt.Errorf("read bank.json: %w", err)
	}

	var bank BankData
	if err := json.Unmarshal(raw, &bank); err != nil {
		return 0, fmt.Errorf("unmarshal bank.json: %w", err)
	}

	// Build chapter_no -> id map
	chapterMap := make(map[int]int)
	rows, err := database.QueryContext(ctx, "SELECT id, chapter_no FROM chapters")
	if err != nil {
		return 0, fmt.Errorf("query chapters: %w", err)
	}
	for rows.Next() {
		var id, chapterNo int
		rows.Scan(&id, &chapterNo)
		chapterMap[chapterNo] = id
	}
	rows.Close()

	// Build existing content prefixes for dedup
	existingPrefixes := make(map[string]bool)
	exRows, _ := database.QueryContext(ctx, "SELECT content FROM questions")
	for exRows.Next() {
		var content string
		exRows.Scan(&content)
		if len(content) > 100 {
			content = content[:100]
		}
		existingPrefixes[content] = true
	}
	exRows.Close()

	imported := 0
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

		chapterNo := moduleToChapterNo(q.Module)
		var chapterArg interface{}
		if chapterNo > 0 {
			if id, ok := chapterMap[chapterNo]; ok {
				chapterArg = id
			}
		}

		// Dedup
		prefix := q.Stem
		if len(prefix) > 100 {
			prefix = prefix[:100]
		}
		if existingPrefixes[prefix] {
			continue
		}
		existingPrefixes[prefix] = true

		_, err := database.ExecContext(ctx,
			`INSERT INTO questions (chapter_id, year, half, exam_type, question_type, content, options, answer_keys, explanation, source, difficulty)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			chapterArg, year, half, examType, "single",
			q.Stem, string(optionsJSON), string(answerKeysJSON),
			q.Analysis, q.Knowledge, difficulty)
		if err != nil {
			log.Printf("skip question %s: %v", q.ID, err)
			continue
		}
		imported++
	}

	return imported, nil
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

	if strings.Contains(term, "模拟") {
		half = "mock"
	}

	return year, half
}

func parseDifficulty(d string) int {
	return strings.Count(d, "★")
}
