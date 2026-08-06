# kuwei-frontend

基于 **Vue 3 + TypeScript + Element Plus + Vite** 的股票策略与回测前端项目。

## 项目概述

该项目聚焦于策略分析与交易信号展示，支持：

- 多策略结果展示与区间筛选
- 买卖点（B/S 点）信息可视化
- 单策略信号聚合统计
- 单策略对多股票同时回测
- 自定义识别器配置（含启用开关）
- 定时任务与自动获取股票信息

从近期提交记录看，项目持续围绕 **回测能力增强、策略信息展示优化、交互样式修复** 迭代。

## 近期更新（基于提交记录）

### 🚀 功能新增

- 增加单策略对多个股票同时进行回测
- 增加定时任务
- 增加自动获取股票信息功能
- 单策略信号列表聚合
- 增加新增股票接口，买卖点增加日期显示
- 增加自定义识别器及“是否启用”功能
- 增加买卖点信息及信号/交易信息

### 🛠 修复与优化

- 调整“是否启用”字段类型为 boolean
- 修复生产环境中策略基础信息显示异常
- 修复/优化回测弹窗、K 线弹窗样式
- 优化汇总 legend 展示与列表样式异常问题
- 修复部分情况下 B/S 点点击无反应
- 优化单策略总信号数、总策略数展示
- 优化非汇总 tab 页面基础信息展示

## 技术栈

- **核心框架**：Vue 3、TypeScript、Vite
- **UI 组件**：Element Plus
- **状态管理**：Pinia
- **路由**：Vue Router
- **图表与数据**：ECharts、Decimal.js、Day.js
- **请求与工具**：Axios、Lodash
- **测试**：Vitest、Playwright

## 目录结构（简要）

- `src/views`：业务页面（策略、回测、展示等）
- `src/components`：通用组件
- `src/store`：状态管理
- `src/router`：路由配置
- `src/api`：接口定义（通过 `api` 别名链接）
- `src/utils`：工具函数

## 环境要求

- Node.js 18+
- pnpm

## 安装与运行

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm run dev

# 生产构建
pnpm run build

# 预览构建产物
pnpm run preview
```

## 测试与质量

```bash
# 单元测试
pnpm run test:unit

# E2E 测试
pnpm run test:e2e

# 类型检查
pnpm run type-check

# 代码检查并自动修复
pnpm run lint
```

## 说明

本 README 根据当前仓库近期提交记录自动梳理生成，便于快速了解项目方向与最近迭代重点。
