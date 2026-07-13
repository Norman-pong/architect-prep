# 系统架构师考试题库调研报告

> 来源：GitHub 开源仓库调研，2026-07-13

## 一、推荐优先级排序

| 优先级 | 仓库 | Stars | 推荐理由 |
|--------|------|-------|----------|
| ⭐⭐⭐⭐⭐ | **wujiaming88/awesome-ruankao** | - | Markdown题库，真题+模拟题，字段规律明显，可直接解析 |
| ⭐⭐⭐⭐⭐ | **louxj424/system-architect-exam** | 39 | Markdown格式，题目版/解析版分离，2020-2025 |
| ⭐⭐⭐⭐ | **PeterGuy326/senior-software-architect-review** | 7 | 自主命题320+题，知识点索引，无版权风险 |
| ⭐⭐⭐⭐ | **Zhang-986/ruankao-architect-practice** | - | 有现成 bank.json 三段式数据模型，可复用导入格式 |
| ⭐⭐⭐ | **xiaomabenten/system_architect** | 4,251 | 仓库内有PDF真题(2009-2025)，需PDF解析 |
| ⭐⭐⭐ | **xxlllq/system_architect** | 8,596 | 资源聚合页，真题在外部网盘，不可直接解析 |
| ⭐⭐⭐ | **ruankaodaren/ruankao** | 1,785 | 软考全科目平台，在线刷题体验好（参考设计） |
| ⭐⭐⭐ | **Nanki-nn/aisoftoj** | 15 | 全栈刷题平台，含数据库schema（参考设计） |
| ⭐⭐ | **tyronczt/system_architect** | 168 | 备考笔记+CSDN博客链接 |
| ⭐⭐ | **fausaitalk/System-Architecture** | 40 | 章节真题汇总，体量较小 |

## 二、重点仓库详情

### 1. xxlllq/system_architect - 资源聚合页（不可直接导入）
- URL: https://github.com/xxlllq/system_architect
- 实际形态：资源链接聚合页，仓库内无结构化题目文件
- 内容：真题(2009-2025) + 论文范文 + 教材均在外部网盘（fchxxn.com / 阿里云盘）
- 可用性：❌ 不可直接程序化导入，需人工下载外部资源 + PDF解析
- 价值：作为人工校对源，获取 PDF 后用解析工具抽取题目

### 2. xiaomabenten/system_architect - PDF资源库
- URL: https://github.com/xiaomabenten/system_architect
- License: MIT
- 实际形态：资源聚合仓库，题目以 PDF 存放（2009-2025历年真题三科+答案详解）
- 论文资料：真题范文26篇 + 参考范文19篇 + 老版50篇，均为 PDF
- 注意：05模拟题、07考前冲刺目录为空；2024/2025为回忆版
- 可用性：PDF需解析后入库，成本较高，但年份覆盖最全(2009-2025)

### 3. louxj424/system-architect-exam — Markdown版（最适合程序化导入）
- URL: https://github.com/louxj424/system-architect-exam
- License: MIT No Attribution
- 题型：历年真题(2020-2025) 三科全覆盖
- 格式：**Markdown**（题目版 + 解析版分离）+ PDF
- 题量：~12套真题
- 解析：✅ 题目版（纯题自测）+ 解析版（含答案和详细分析）
- 可用性：⭐ 最佳程序化处理格式，可直接解析入库

### 4. PeterGuy326 — 自主命题题库（补充练习）
- URL: https://github.com/PeterGuy326/senior-software-architect-review
- 题型：自主命题模拟题（非真题，无版权问题）
- 格式：Markdown
- 题量：综合知识320+题 / 案例26道 / 论文21道 / 范文18篇
- 解析：✅ 每题含答案+详细解析
- 可用性：知识点→例题索引设计优秀，适合专项练习

### 5. wujiaming88/awesome-ruankao - Markdown题库（新发现，首选导入源）
- URL: https://github.com/wujiaming88/awesome-ruankao
- 题型：历年真题 + 模拟题，均以 Markdown 拆分「题目/答案」文件
- 格式：Markdown，字段规律明显（题目、选项、答案、解析、考点、难度）
- 可用性：⭐⭐⭐⭐⭐ 可直接编写 Markdown 解析器 -> JSON -> 入库

### 6. Zhang-986/ruankao-architect-practice - 现成JSON数据模型（新发现）
- URL: https://github.com/Zhang-986/ruankao-architect-practice
- 数据：从 awesome-ruankao 的 Markdown 题库生成 `data/bank.json`
- 格式：三段式 JSON（choices/cases/essays），含 schemaVersion
- 可用性：可直接复用为导入中间格式参考

## 三、题库导入策略

### 导入优先级

```txt
Phase 1（先导入，程序化处理）
├── wujiaming88/awesome-ruankao Markdown 题库
│   └── 解析 Markdown -> 结构化 JSON -> 入库（字段最规整）
├── louxj424 Markdown 真题 (2020-2025, ~12套)
│   └── 直接解析 Markdown -> 入库（题目版/解析版分离）
├── Zhang-986/ruankao-architect-practice bank.json
│   └── 直接导入三段式 JSON（现成数据，验证导入管道）
└── PeterGuy326 自主命题 (320+题)
    └── 解析 Markdown -> 入库（无版权风险）

Phase 2（PDF解析后导入，年份补全）
├── xiaomabenten 仓库内 PDF 真题 (2009-2019 早年真题)
│   └── PDF文本提取 -> 人工校对 -> 入库
└── xxlllq 外部网盘 PDF（补充资源）
    └── 人工下载 -> PDF文本提取 -> 人工校对 -> 入库

Phase 3（参考但不直接导入）
├── ruankaodaren 在线平台 -> 参考功能设计，不导入题目
└── Nanki-nn/aisoftoj -> 参考数据库 schema 设计
```

### 数据格式设计（导入管道）

```typescript
// 统一中间格式
interface QuestionData {
  id: string;
  year?: number;                    // 真题年份
  half?: 'first' | 'second';        // 上半年/下半年
  exam_type: 'comprehensive' | 'case' | 'essay';  // 综合知识/案例/论文
  chapter_id: number;               // 关联知识体系章节
  question_type: 'single' | 'multiple' | 'case' | 'essay';
  content: string;                  // 题干
  options?: string[];               // 选项（选择题）
  answer_keys?: string[];           // 正确选项键数组，如 ["A"] / ["A","C","D"]，集合比对判分
  source: string;                   // 来源仓库
  difficulty?: 1 | 2 | 3 | 4 | 5;   // 难度
}
```
