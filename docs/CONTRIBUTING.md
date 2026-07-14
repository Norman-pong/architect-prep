# 文档贡献指南

> 修改记录：执行 `lore log docs/CONTRIBUTING.md`

本文档说明如何参与项目文档的编写、审核和维护。

## 1. 文档结构

```
docs/
├── index.md               # 文档总索引
├── CONTRIBUTING.md        # 本文档
├── spec/                  # 结构化需求输入
├── prd/                   # 产品需求文档
│   └── archive/           # 已归档 PRD
├── phase/                 # 阶段文档
├── architecture/          # 架构文档
└── reference/             # 参考资料

## 2. 工作流程

### 2.1 创建新文档

1. 查询 lore 约束：`lore constraints docs/<目录> --json`
2. 复制对应模板（`docs/<type>/_template.md`）
3. 命名：PRD/Phase 用 `YYYY-MM-DD-<name>.md`，Architecture 用 `<topic>.md`
4. 更新 `docs/index.md`
5. 用 lore 提交

### 2.2 修改现有文档

1. 查询约束：`lore constraints docs/<文件路径> --json`
2. 修改文档
3. 同步更新索引
4. 用 lore 提交

## 3. 命名规范

- **PRD**：`YYYY-MM-DD-<prd-name>.md`
- **Spec**：`YYYY-MM-DD-<spec-name>.md`
- **Phase**：`YYYY-MM-DD-<phase-name>.md`
- **Architecture**：`<topic>.md`
- **Reference**：`<source-name>.md`

## 4. Lore 协议

提交变更：

```bash
echo '{
  "intent": "<简短描述>",
  "body": "<详细说明>",
  "trailers": {
    "Constraint": ["<硬规则>"],
    "Tested": ["<已验证内容>"]
  }
}' | lore commit
```

## 5. 质量检查

- [ ] 查询了 lore 约束
- [ ] 遵循命名规范
- [ ] PRD/Phase 一一对应
- [ ] 更新了相关索引
- [ ] 检查了文档内链接
- [ ] 使用 lore 提交
