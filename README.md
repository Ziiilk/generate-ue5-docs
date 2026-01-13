# UE5 API文档生成工具

## 概述

本工具用于自动分析UE5.1引擎源码，生成高详细度的API文档集合。工具使用 Node.js/TypeScript 实现。

## 功能

- 扫描Engine/Source目录，识别所有模块
- 解析模块依赖关系
- 提取API信息（类、函数、枚举等）
- 生成Markdown文档和JSON结构化数据
- 支持增量更新

## 安装

```bash
npm install
```

## 使用方法

### 基本用法

```bash
npm start -- --source-dir Engine/Source --output-dir docs/ue5-api
```

### 使用编译后的版本

```bash
npm run build
node dist/index.js --source-dir Engine/Source --output-dir docs/ue5-api
```

### 命令行参数

- `--source-dir <dir>`: 引擎源码目录（默认: Engine/Source）
- `--output-dir <dir>`: 输出目录（默认: docs/ue5-api）
- `--engine-version <version>`: 引擎版本（默认: 5.1）
- `--categories <categories...>`: 要处理的模块类别（默认: Runtime Editor Developer Programs）
- `--exclude-dirs <dirs...>`: 要排除的目录（默认: ThirdParty）
- `--verbose`: 显示详细日志

### 示例

```bash
# 只处理 Runtime 模块
npm start -- --categories Runtime

# 指定不同的输出目录
npm start -- --output-dir ./my-docs

# 显示详细日志
npm start -- --verbose
```

## 输出结构

```
docs/ue5-api/
├── modules/          # 按模块组织的Markdown文档
│   ├── Core/
│   │   ├── overview.md
│   │   ├── api.md
│   │   ├── classes.md
│   │   ├── best-practices.md
│   │   └── examples.md
│   └── ...
├── data/             # JSON结构化数据
│   ├── modules.json
│   ├── api-index.json
│   └── [module-name].json
├── index.md          # 总索引
├── README.md         # 文档说明
├── generation.log    # 生成日志
└── generation_report.txt  # 生成报告
```

## 开发

### 项目结构

```
.
├── src/
│   ├── index.ts              # 主入口文件
│   ├── config.ts             # 配置管理
│   ├── types.ts              # TypeScript 类型定义
│   ├── module-scanner.ts     # 模块扫描器
│   ├── build-cs-parser.ts    # Build.cs 文件解析器
│   ├── api-parser.ts         # C++ API 解析器
│   ├── markdown-generator.ts # Markdown 文档生成器
│   ├── json-generator.ts     # JSON 数据生成器
│   ├── best-practices-extractor.ts  # 最佳实践提取器
│   └── example-extractor.ts  # 示例提取器
├── dist/                     # TypeScript 编译输出（自动生成）
├── docs/                     # 生成的文档（自动生成，已忽略）
├── node_modules/             # 依赖包（自动生成，已忽略）
├── .gitignore                # Git 忽略文件配置
├── package.json              # 项目配置和依赖
├── package-lock.json         # 依赖锁定文件（已忽略）
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 本文档
```

### 开发命令

```bash
# 安装依赖
npm install

# 开发模式（使用 tsx 直接运行）
npm run dev

# 编译 TypeScript
npm run build

# 运行编译后的代码
npm start
```

## 技术栈

- **Node.js**: >= 18.0.0
- **TypeScript**: ES2022+
- **依赖**:
  - `commander`: 命令行参数解析
  - `tsx`: TypeScript 执行器（开发）

## 注意事项

- 工具需要访问 UE5 引擎源码目录
- 生成过程可能需要较长时间，取决于源码规模
- 文档使用相对路径格式（Engine/Source/...），不依赖绝对路径
- 某些复杂的 C++ 语法可能无法完全解析
- 生成的文档默认保存在 `docs/ue5-api/` 目录（可通过 `--output-dir` 参数修改）
- `dist/` 和 `docs/` 目录已配置在 `.gitignore` 中，不会被提交到版本控制

## 迁移说明

本工具从 Python 版本迁移而来，保持了功能兼容性，但优化了架构和接口设计。

## 许可证

MIT
