package main

// gencards.go - 从 markdown 教材自动生成知识卡片
// 用法：go run scripts/gencards.go
//
// 规则：
// - 每个 ## 标题（除"参考文献"）生成 1 张卡片
// - Front: "## 标题" → "标题：核心概念是什么？"
// - Back: 该章节前 200 字符的纯文本内容（去除 markdown 标记）
// - 跳过已有的 front 字符串，避免重复

import (
	"bufio"
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"unicode/utf8"
)

const (
	mdDir      = "internal/seed/markdown"
	cardFile   = "internal/seed/knowledge_cards.go"
	maxBackLen = 200
)

type Card struct {
	ChapterNo int
	Front     string
	Back      string
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "gencards error:", err)
		os.Exit(1)
	}
}

func run() error {
	// 1. 加载已有卡片 front 集合
	existing, err := loadExistingFronts(cardFile)
	if err != nil {
		return fmt.Errorf("load existing: %w", err)
	}
	fmt.Printf("loaded %d existing fronts from %s\n", len(existing), cardFile)

	// 2. 遍历 markdown 文件，按章节号排序
	files, err := filepath.Glob(filepath.Join(mdDir, "ch*.md"))
	if err != nil {
		return err
	}
	sort.Strings(files)

	var newCards []Card
	for _, f := range files {
		chapterNo, ok := chapterFromFilename(f)
		if !ok {
			continue
		}
		cards, err := extractFromChapter(f, chapterNo, existing)
		if err != nil {
			fmt.Fprintf(os.Stderr, "warning: %s: %v\n", f, err)
			continue
		}
		newCards = append(newCards, cards...)
	}

	fmt.Printf("generated %d new cards\n", len(newCards))

	// 3. 追加到 knowledge_cards.go
	return appendToFile(cardFile, newCards)
}

var reChapterFile = regexp.MustCompile(`ch(\d+)\.md$`)

func chapterFromFilename(path string) (int, bool) {
	m := reChapterFile.FindStringSubmatch(path)
	if m == nil {
		return 0, false
	}
	var n int
	fmt.Sscanf(m[1], "%d", &n)
	return n, n >= 1 && n <= 20
}

func loadExistingFronts(path string) (map[string]bool, error) {
	set := map[string]bool{}
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return set, nil
		}
		return nil, err
	}
	// Match Front: `...` or Front: "..." (both backtick and ASCII quote)
	reBacktick := regexp.MustCompile("Front:\\s*`([^`]+)`")
	reAscii := regexp.MustCompile(`Front:\s*"([^"]+)"`)
	for _, m := range reBacktick.FindAllStringSubmatch(string(data), -1) {
		set[m[1]] = true
	}
	for _, m := range reAscii.FindAllStringSubmatch(string(data), -1) {
		set[m[1]] = true
	}
	return set, nil
}

func extractFromChapter(path string, chapter int, existing map[string]bool) ([]Card, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cards []Card
	scanner := bufio.NewScanner(bytes.NewReader(data))
	scanner.Buffer(make([]byte, 1024*1024), 4*1024*1024)

	var currentH2 string
	var currentContent strings.Builder
	isRef := false

	flush := func() {
		title := strings.TrimSpace(currentH2)
		if title == "" {
			currentContent.Reset()
			return
		}
		// skip reference section
		if strings.Contains(title, "参考文献") {
			currentContent.Reset()
			return
		}
		// generate front + back
		front := buildFront(title)
		if existing[front] {
			currentContent.Reset()
			return
		}
		back := buildBack(currentContent.String(), title)
		if back == "" {
			currentContent.Reset()
			return
		}
		cards = append(cards, Card{ChapterNo: chapter, Front: front, Back: back})
		currentContent.Reset()
	}

	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "## ") && !strings.HasPrefix(trimmed, "### ") {
			// flush previous H2
			flush()
			currentH2 = strings.TrimPrefix(trimmed, "## ")
			isRef = strings.Contains(currentH2, "参考文献")
		} else if !isRef {
			currentContent.WriteString(line)
			currentContent.WriteString("\n")
		}
	}
	flush()

	return cards, scanner.Err()
}

func buildFront(title string) string {
	// Convert "软件架构的定义" → "软件架构的定义是什么？"
	// "如何衡量一名优秀架构设计师" → "如何衡量一名优秀架构设计师？"
	// "架构设计师的能力要求" → "架构设计师需要哪些能力要求？"
	t := strings.TrimSpace(title)
	if strings.HasSuffix(t, "是什么") || strings.HasSuffix(t, "有哪些") || strings.HasSuffix(t, "如何") || strings.HasSuffix(t, "怎样") {
		return t + "？"
	}
	// detect noun-ish titles
	if strings.HasSuffix(t, "的定义") {
		return t + "是什么？"
	}
	if strings.HasSuffix(t, "的分类") {
		return t + "有哪些？"
	}
	if strings.HasSuffix(t, "的特点") || strings.HasSuffix(t, "的特征") {
		return t + "是什么？"
	}
	if strings.HasSuffix(t, "的职责") || strings.HasSuffix(t, "的要求") {
		return t + "是什么？"
	}
	// default
	return t + "的核心内容是什么？"
}

var (
	reMDLink    = regexp.MustCompile(`\[([^\]]+)\]\([^)]+\)`)
	reFootnote  = regexp.MustCompile(`\[\^[^\]]+\]`)
	reBold      = regexp.MustCompile(`\*\*([^*]+)\*\*`)
	reItalic    = regexp.MustCompile(`\*([^*]+)\*`)
	reCode      = regexp.MustCompile("`[^`]+`")
	reMermaid   = regexp.MustCompile("(?s)```mermaid.*?```")
	reCodeBlock = regexp.MustCompile("(?s)```.*?```")
	reHeading   = regexp.MustCompile(`(?m)^#{1,6}\s+.*$`)
	reListItem  = regexp.MustCompile(`(?m)^\s*[-*]\s+`)
	reNumItem   = regexp.MustCompile(`(?m)^\s*\d+[.)]\s+`)
	rePipe      = regexp.MustCompile(`\|`)
	reMultiple  = regexp.MustCompile(`\s+`)
)

func buildBack(content, title string) string {
	s := content
	// strip code blocks / mermaid first
	s = reMermaid.ReplaceAllString(s, "")
	s = reCodeBlock.ReplaceAllString(s, "")
	// strip headers
	s = reHeading.ReplaceAllString(s, "")
	// strip list bullets
	s = reListItem.ReplaceAllString(s, "")
	s = reNumItem.ReplaceAllString(s, "")
	// strip markdown formatting
	s = reMDLink.ReplaceAllString(s, "$1")
	s = reFootnote.ReplaceAllString(s, "")
	s = reBold.ReplaceAllString(s, "$1")
	s = reItalic.ReplaceAllString(s, "$1")
	s = reCode.ReplaceAllString(s, "")
	s = rePipe.ReplaceAllString(s, " ")
	// collapse whitespace
	s = reMultiple.ReplaceAllString(s, " ")
	s = strings.TrimSpace(s)

	if s == "" {
		return ""
	}

	// take first sentence/paragraph up to maxBackLen
	runes := []rune(s)
	if len(runes) > maxBackLen {
		// cut at sentence boundary
		cut := maxBackLen
		for i := maxBackLen; i > maxBackLen-30 && i > 0; i-- {
			r := rune(s[i])
			if r == '。' || r == '；' || r == '!' || r == '?' {
				cut = i + 1
				break
			}
		}
		s = string(runes[:cut])
	}
	// ensure ends with "。"
	if !strings.HasSuffix(s, "。") && !strings.HasSuffix(s, "；") {
		s += "。"
	}
	if utf8.RuneCountInString(s) > maxBackLen+20 {
		runes := []rune(s)
		s = string(runes[:maxBackLen]) + "…"
	}
	return s
}

func appendToFile(path string, cards []Card) error {
	if len(cards) == 0 {
		fmt.Println("no new cards to append")
		return nil
	}
	existing, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	text := string(existing)
	// find last `}` and insert before it
	idx := strings.LastIndex(text, "}")
	if idx < 0 {
		return fmt.Errorf("no closing brace in %s", path)
	}
	var b strings.Builder
	b.WriteString(text[:idx])
	for _, c := range cards {
		// use backtick raw string - safe for any character except backtick
		// backtick content is sanitized
		front := strings.ReplaceAll(c.Front, "`", "'")
		back := strings.ReplaceAll(c.Back, "`", "'")
		back = strings.ReplaceAll(back, "\n", " ")
		fmt.Fprintf(&b, "\t{ChapterNo: %d, Front: `%s`, Back: `%s`},\n", c.ChapterNo, front, back)
	}
	b.WriteString(text[idx:])
	return os.WriteFile(path, []byte(b.String()), 0o644)
}
