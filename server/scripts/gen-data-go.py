#!/usr/bin/env python3
"""Generate data.go Points arrays from markdown ## headings."""
import re, os, sys

MD_DIR = os.path.join(os.path.dirname(__file__), "..", "internal", "seed", "markdown")
DATA_GO = os.path.join(os.path.dirname(__file__), "..", "internal", "seed", "data.go")

def extract_points(md_path):
    """Extract ## headings (excluding 参考文献) and first paragraph as content."""
    with open(md_path, encoding='utf-8') as f:
        lines = f.readlines()
    
    points = []
    current_title = None
    current_content = []
    
    for line in lines:
        if line.startswith('## ') and not line.startswith('## 参考文献'):
            # Save previous point
            if current_title:
                content = ' '.join(current_content).strip()
                # Truncate to first sentence/short summary
                if len(content) > 200:
                    # Find first sentence boundary
                    for i, ch in enumerate(content):
                        if ch in '。；' and i > 50:
                            content = content[:i+1]
                            break
                    if len(content) > 200:
                        content = content[:197] + '...'
                points.append((current_title, content))
            
            current_title = line.strip()[3:].strip()
            current_content = []
        elif current_title and not line.startswith('#') and not line.startswith('>') and not line.startswith('```') and not line.startswith('|') and line.strip():
            if not current_content:
                current_content.append(line.strip())
            elif len(' '.join(current_content)) < 200:
                current_content.append(line.strip())
    
    # Save last point
    if current_title:
        content = ' '.join(current_content).strip()
        if len(content) > 200:
            for i, ch in enumerate(content):
                if ch in '。；' and i > 50:
                    content = content[:i+1]
                    break
            if len(content) > 200:
                content = content[:197] + '...'
        points.append((current_title, content))
    
    return points

def escape_go_string(s):
    """Escape string for Go double-quoted string literal."""
    s = s.replace('\\', '\\\\')
    s = s.replace('"', '\\"')
    s = s.replace('\n', ' ')
    return s

# Chapter metadata (title + summary) - keep existing, only regenerate Points
CHAPTER_META = {
    1: ("绪论", "系统架构基本概念、架构设计师职责与能力要求"),
    2: ("计算机系统基础知识", "计算机硬件、操作系统、网络、嵌入式系统、系统性能"),
    3: ("信息系统基础知识", "信息系统分类：TPS/MIS/DSS/ES/OAS/ERP及典型架构模型"),
    4: ("信息安全技术基础知识", "加密解密、密钥管理、访问控制、数字签名、抗攻击技术"),
    5: ("软件工程基础知识", "软件过程模型、需求工程、系统分析与设计、软件测试、项目管理"),
    6: ("数据库设计基础知识", "关系数据库、数据库设计步骤、数据交互、NoSQL"),
    7: ("系统架构设计基础知识", "架构设计概念、ABSD方法、架构风格、软件架构文档化与复用"),
    8: ("系统质量属性与架构评估", "质量属性、架构评估方法ATAM/SAAM、敏感点与权衡点"),
    9: ("软件可靠性基础知识", "可靠性定义、可靠性分析、可靠性设计、可靠性测试与评估"),
    10: ("软件架构的演化和维护", "演化定义、演化原则、演化过程、架构维护"),
    11: ("未来信息综合技术", "信息物理系统CPS、人工智能、边缘计算、数字孪生"),
    12: ("信息系统架构设计理论与实践", "信息系统架构风格、分类、企业总体框架、ADM方法"),
    13: ("层次式架构设计理论与实践", "表现层、中间层、数据访问层、数据架构、物联网层次架构"),
    14: ("云原生架构设计理论与实践", "容器、微服务、无服务器、服务网格"),
    15: ("面向服务架构设计理论与实践", "SOA概述、关键技术、微服务"),
    16: ("嵌入式系统架构设计理论与实践", "嵌入式硬件、操作系统、数据库、中间件、开发环境"),
    17: ("通信系统架构设计理论与实践", "网络架构、组网技术、SDN、网络安全"),
    18: ("安全架构设计理论与实践", "安全模型、WPDRRC、网络安全体系、数据库安全"),
    19: ("大数据架构设计理论与实践", "Lambda架构、Kappa架构、大数据处理"),
    20: ("系统架构设计师论文写作要点", "论文格式、写作方法、摘要与正文"),
}

# Generate data.go
lines = [
    'package seed',
    '',
    '// ChapterData 章节数据',
    'type ChapterData struct {',
    '\tChapterNo int              `json:"chapter_no"`',
    '\tTitle     string            `json:"title"`',
    '\tSummary   string           `json:"summary"`',
    '\tPoints    []KnowledgePoint `json:"points"`',
    '}',
    '',
    '// KnowledgePoint 知识点',
    'type KnowledgePoint struct {',
    '\tTitle   string `json:"title"`',
    '\tContent string `json:"content"`',
    '}',
    '',
    '// Chapters 20章完整知识体系数据',
    'var Chapters = []ChapterData{',
]

for ch_no in range(1, 21):
    md_path = os.path.join(MD_DIR, f"ch{ch_no:02d}.md")
    title, summary = CHAPTER_META[ch_no]
    
    if not os.path.exists(md_path):
        print(f"WARNING: {md_path} not found, skipping chapter {ch_no}", file=sys.stderr)
        continue
    
    points = extract_points(md_path)
    if not points:
        print(f"WARNING: no points found in {md_path}", file=sys.stderr)
        continue
    
    lines.append('\t{')
    lines.append(f'\t\tChapterNo: {ch_no}, Title: "{escape_go_string(title)}", Summary: "{escape_go_string(summary)}",')
    lines.append('\t\tPoints: []KnowledgePoint{')
    
    for pt_title, pt_content in points:
        lines.append(f'\t\t\t{{Title: "{escape_go_string(pt_title)}", Content: "{escape_go_string(pt_content)}"}},')
    
    lines.append('\t\t},')
    lines.append('\t},')
    print(f"ch{ch_no:02d}: {len(points)} points", file=sys.stderr)

lines.append('}')

with open(DATA_GO, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')

print(f"\nGenerated {DATA_GO}", file=sys.stderr)
