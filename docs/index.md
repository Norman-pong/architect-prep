# 项目文档索引

> 修改记录：执行 `lore log docs/index.md`

本文档是项目文档的总入口，维护所有文档的索引和状态。

## 快速导航

### 核心文档

| 文档类型 | 最新文档 | 状态 | 说明 |
| -------- | -------- | ---- | ---- |
| Spec | [2026-07-13-architect-prep](spec/2026-07-13-architect-prep.md) | 已提纯 PRD | 项目初始需求输入 |
| PRD | [FSRS 遗忘曲线复习系统](prd/2026-07-14-fsrs-review-system.md) | 活跃 | FSRS 复习系统（[备考平台 PRD 已归档](prd/archive/2026-07-13-architect-prep-platform.md)） |
| Phase | [2026-07-14 知识体系入库与刷题核心](phase/2026-07-14-knowledge-and-practice.md) | 已完成 | 知识入库+刷题 |
| 架构总览 | [架构总览](architecture/overview.md) | 当前 | 系统架构全景 |

## 结构化需求输入（Spec）

| 日期 | 文档名称 | 接力状态 | 对应 PRD | 说明 |
| ---------- | -------- | ---------- | -------- | ---- |
| 2026-07-13 | [系统架构师备考平台](spec/2026-07-13-architect-prep.md) | 已提纯 PRD | [PRD（已归档）](prd/archive/2026-07-13-architect-prep-platform.md) | 项目初始需求 |

## 产品需求文档（PRD）

### 活跃 PRD
| 日期 | 文档名称 | 状态 | 对应 Phase | 说明 |
| ---------- | -------- | ---- | ---------- | ---- |
| 2026-07-14 | [FSRS 遗忘曲线复习系统](prd/2026-07-14-fsrs-review-system.md) | 活跃 | [Phase 3](phase/2026-07-14-fsrs-review-system.md) | FSRS 间隔重复+知识卡片 |

### 已归档 PRD

| 日期 | 文档名称 | 状态 | 对应 Phase | 说明 |
| ---------- | -------- | ---- | ---------- | ---- |
| 2026-07-13 | [备考平台 PRD](prd/archive/2026-07-13-architect-prep-platform.md) | 已归档 | [Phase 1](phase/2026-07-13-foundation-skeleton.md) / [Phase 2](phase/2026-07-14-knowledge-and-practice.md) | 知识体系+刷题一体化 |

## 阶段文档（Phase）

| 日期 | 阶段名称 | 状态 | 对应 PRD | 说明 |
| ---------- | -------- | ---- | -------- | ---- |
| 2026-07-13 | [项目骨架搭建](phase/2026-07-13-foundation-skeleton.md) | 已完成 | [PRD（已归档）](prd/archive/2026-07-13-architect-prep-platform.md) | 前后端+Docker 骨架 |
| 2026-07-14 | [知识体系入库与刷题核心](phase/2026-07-14-knowledge-and-practice.md) | 已完成 | [PRD（已归档）](prd/archive/2026-07-13-architect-prep-platform.md) | 知识入库+刷题功能 |
| 2026-07-14 | [FSRS 遗忘曲线复习系统](phase/2026-07-14-fsrs-review-system.md) | 进行中 | [FSRS PRD](prd/2026-07-14-fsrs-review-system.md) | FSRS6 间隔重复+知识卡片 |

## 架构文档（Architecture）

| 文档名称 | 主题 | 最后更新 | 说明 |
| -------- | ---- | -------- | ---- |
| [架构总览](architecture/overview.md) | 系统架构全景 | 2026-07-13 | 技术栈、模块、部署 |
| [移动端学习体验设计](architecture/mobile-learning-design.md) | 移动端 UI | 2026-07-14 | 知识体系页面移动端方案 |
| [知识体系框架](architecture/knowledge-framework.md) | 教材 20 章 | 2026-07-13 | 考试重点分布 |
| [题库调研报告](architecture/question-bank-research.md) | GitHub 题库 | 2026-07-13 | 10 仓库+导入策略 |

## 参考资料（Reference）

| 资料名称 | 类型 | 最后更新 | 说明 |
| -------- | ---- | -------- | ---- |
| [系统架构设计师教程第2版](reference/) | PDF 教材 | 2022 | 官方考试指定用书 |

## 贡献指南

- [文档贡献指南](CONTRIBUTING.md)：了解如何参与文档编写和维护

## 文档统计

- 活跃 PRD：1
- 归档 PRD：1
- Phase 总数：3
- 架构文档：4
- 参考资料：1

最后更新：2026-07-14
