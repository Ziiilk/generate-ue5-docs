# UE5 API文档生成工具

## 概述

本工具用于自动分析UE5.1引擎源码，生成高详细度的API文档集合。工具使用 Node.js/TypeScript 实现。

## 功能

- 扫描Engine/Source目录，识别所有模块
- 扫描Engine/Plugins目录，识别所有插件模块
- 解析模块依赖关系
- 提取API信息（类、函数、枚举等）
- 生成Markdown文档和JSON结构化数据
- 支持增量更新

## 安装

### 通过 npm 安装（推荐）

```bash
# 全局安装（推荐，可直接使用 CLI）
npm install -g generate-ue5-docs

# 或使用 npx（无需安装）
npx generate-ue5-docs --source-dir <path> --plugins-dir <path> --output-dir <path>

# 本地安装到项目
npm install generate-ue5-docs
```

### 从源码安装（开发使用）

```bash
# 克隆仓库后安装依赖
npm install
```

## 使用方法

### 通过 npm 安装的 CLI 使用（推荐）

```bash
# 全局安装后直接使用
generate-ue5-docs --source-dir Engine/Source --plugins-dir Engine/Plugins --output-dir docs/ue5-api

# 或使用 npx（无需安装）
npx generate-ue5-docs --source-dir Engine/Source --plugins-dir Engine/Plugins --output-dir docs/ue5-api
```

### 从源码开发使用

```bash
# 开发模式（使用 tsx 直接运行）
npm start -- --source-dir Engine/Source --plugins-dir Engine/Plugins --output-dir docs/ue5-api

# 或编译后运行
npm run build
node dist/index.js --source-dir Engine/Source --plugins-dir Engine/Plugins --output-dir docs/ue5-api
```

### 命令行参数

- `--source-dir <dir>`: 引擎源码目录（默认: Engine/Source）
- `--plugins-dir <dir>`: 插件目录（默认: Engine/Plugins）
- `--output-dir <dir>`: 输出目录（默认: docs/ue5-api）
- `--engine-version <version>`: 引擎版本（默认: 5.1）
- `--categories <categories...>`: 要处理的模块类别（默认: Runtime Editor Developer Programs）
- `--exclude-dirs <dirs...>`: 要排除的目录（默认: ThirdParty）
- `--verbose`: 显示详细日志

### 示例

```bash
# 只处理 Runtime 模块
generate-ue5-docs --categories Runtime

# 指定不同的输出目录
generate-ue5-docs --output-dir ./my-docs

# 显示详细日志
generate-ue5-docs --verbose

# 完整示例：指定源码和插件目录
generate-ue5-docs \
  --source-dir /path/to/Engine/Source \
  --plugins-dir /path/to/Engine/Plugins \
  --output-dir ./docs/ue5-api
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
- 文档使用相对路径格式：
  - Source 模块：`Engine/Source/{Category}/{ModuleName}`
  - Plugins 模块：`Engine/Plugins/{PluginName}/Source/{ModuleName}`
  - 所有路径均为相对路径，不依赖绝对路径，可在不同环境中使用
- 插件模块在生成的文档中会被归类到 `Plugins` 类别（category: "Plugins"）
- 某些复杂的 C++ 语法可能无法完全解析
- 生成的文档默认保存在 `docs/ue5-api/` 目录（可通过 `--output-dir` 参数修改）
- `dist/` 和 `docs/` 目录已配置在 `.gitignore` 中，不会被提交到版本控制

## 版本说明

### 1.0.1
- ✨ 新增：支持扫描 `Engine/Plugins` 目录下的插件模块
- ✨ 新增：插件模块文档生成和索引支持
- ✨ 新增：CLI 参数 `--plugins-dir` 用于指定插件目录（默认: Engine/Plugins）
- 📝 改进：索引文件现在包含 Source 模块和 Plugins 模块的分类显示

## 迁移说明

本工具从 Python 版本迁移而来，保持了功能兼容性，但优化了架构和接口设计。

## 许可证

MIT
