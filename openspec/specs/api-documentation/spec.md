# api-documentation Specification

## Purpose
提供自动化工具，分析UE5.1引擎源码，生成高详细度的API文档集合，供AI agent在开发插件和项目时查询和参考。工具使用 Node.js/TypeScript 实现，位于项目根目录的 `src/` 目录。
## Requirements
### Requirement: UE5引擎源码文档生成系统

系统SHALL提供自动化工具（Node.js/TypeScript实现），分析UE5.1引擎源码（Engine/Source目录下的Runtime、Editor、Developer、Programs模块以及Engine/Plugins目录下的插件模块），生成高详细度的API文档集合，供AI agent在开发插件和项目时查询和参考。

#### Scenario: 生成Core模块文档
- **WHEN** 运行文档生成工具，指定Engine/Source目录
- **THEN** 工具扫描Runtime/Core模块，识别所有Public头文件
- **AND** 提取所有类、结构体、枚举、函数等API信息
- **AND** 生成Core模块的Markdown文档（overview.md, api.md, classes.md等）
- **AND** 生成Core模块的JSON结构化数据文件

#### Scenario: 生成插件模块文档
- **WHEN** 运行文档生成工具，指定Engine/Plugins目录
- **THEN** 工具扫描Engine/Plugins下每个插件目录的Source子目录
- **AND** 识别插件中的模块（查找.Build.cs文件）
- **AND** 提取插件模块的API信息（类、结构体、枚举、函数等）
- **AND** 生成插件模块的Markdown文档（overview.md, api.md, classes.md等）
- **AND** 生成插件模块的JSON结构化数据文件
- **AND** 插件模块的category字段设置为"Plugins"

#### Scenario: 生成完整模块索引
- **WHEN** 文档生成工具完成所有模块的分析
- **THEN** 生成modules.json文件，包含所有模块的元数据（名称、路径、依赖关系）
- **AND** 生成api-index.json文件，包含所有API的快速查找信息
- **AND** 生成index.md总索引文件，提供导航和概览
- **AND** 索引文件包含Source模块和Plugins模块

#### Scenario: 路径无关性
- **WHEN** 文档中引用源码文件或模块
- **THEN** 使用相对路径格式`Engine/Source/{Category}/{ModuleName}`或`Engine/Plugins/{PluginName}/Source/{ModuleName}`
- **AND** 不包含任何绝对路径信息
- **AND** 文档可以在不同环境中使用，无需修改路径引用

#### Scenario: 模块依赖关系提取
- **WHEN** 解析模块的.Build.cs文件
- **THEN** 提取PublicDependencyModuleNames、PrivateDependencyModuleNames等依赖信息
- **AND** 在模块文档中记录依赖关系
- **AND** 在JSON数据中包含依赖关系图

#### Scenario: API信息提取
- **WHEN** 分析Public头文件
- **THEN** 提取所有类定义（包括继承关系、成员函数、属性）
- **AND** 提取所有结构体定义
- **AND** 提取所有枚举定义
- **AND** 提取所有全局函数和模板函数
- **AND** 提取API的访问修饰符（public、protected等）
- **AND** 提取函数参数类型和返回类型

#### Scenario: 生成Markdown文档
- **WHEN** 为每个模块生成文档
- **THEN** 生成overview.md（模块概览、用途、依赖、平台支持）
- **AND** 生成api.md（所有公共API的详细说明，包括签名、参数、返回值）
- **AND** 生成classes.md（类的继承关系、成员函数、属性说明）
- **AND** 生成best-practices.md（基于代码分析的最佳实践）
- **AND** 生成examples.md（常见使用场景的代码示例）

#### Scenario: 生成结构化数据
- **WHEN** 为每个模块生成JSON数据
- **THEN** 包含模块元数据（名称、路径、版本、依赖）
- **AND** 包含所有类的详细信息（名称、基类、成员）
- **AND** 包含所有函数的详细信息（名称、参数、返回类型、文档）
- **AND** 包含所有枚举的详细信息（名称、值列表）
- **AND** JSON格式符合预定义的schema

#### Scenario: 版本信息记录
- **WHEN** 生成文档
- **THEN** 在文档中包含引擎版本信息（5.1）
- **AND** 在JSON数据中包含版本字段
- **AND** 在文档头部包含生成时间和工具版本

#### Scenario: 增量更新支持
- **WHEN** 重新运行文档生成工具
- **THEN** 工具可以检测已存在的文档
- **AND** 仅更新变更的模块
- **AND** 保持未变更模块的文档不变
- **AND** 更新索引文件以反映变更

#### Scenario: 排除ThirdParty模块
- **WHEN** 扫描Engine/Source目录
- **THEN** 工具跳过ThirdParty目录下的所有模块
- **AND** 仅处理Runtime、Editor、Developer、Programs目录下的模块
- **WHEN** 扫描Engine/Plugins目录
- **THEN** 工具跳过ThirdParty插件目录

#### Scenario: 文档格式验证
- **WHEN** 生成文档后
- **THEN** Markdown文件格式正确，可以正常渲染
- **AND** JSON文件格式有效，可以通过JSON schema验证
- **AND** 所有内部链接正确（模块间引用、API交叉引用）

#### Scenario: 错误处理和报告
- **WHEN** 解析过程中遇到错误（如无法解析的文件、格式错误等）
- **THEN** 工具记录错误信息到日志文件
- **AND** 继续处理其他模块，不中断整个流程
- **AND** 在最终报告中汇总所有错误和警告

