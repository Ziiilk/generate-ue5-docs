/**
 * Markdown文档生成器：生成人类可读的Markdown格式文档
 */
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { ModuleData } from './types.js';
import { ExampleExtractor } from './example-extractor.js';
import { BestPracticesExtractor } from './best-practices-extractor.js';

export class MarkdownGenerator {
  private outputDir: string;
  private engineVersion: string;
  private modulesDir: string;
  private exampleExtractor: ExampleExtractor;
  private practicesExtractor: BestPracticesExtractor;

  constructor(outputDir: string, engineVersion: string) {
    this.outputDir = outputDir;
    this.engineVersion = engineVersion;
    this.modulesDir = join(outputDir, 'modules');
    this.exampleExtractor = new ExampleExtractor();
    this.practicesExtractor = new BestPracticesExtractor();
  }

  async initialize(): Promise<void> {
    if (!existsSync(this.modulesDir)) {
      await mkdir(this.modulesDir, { recursive: true });
    }
  }

  async generateModuleDocs(moduleName: string, moduleData: ModuleData): Promise<void> {
    await this.initialize();
    
    const moduleDir = join(this.modulesDir, moduleName);
    if (!existsSync(moduleDir)) {
      await mkdir(moduleDir, { recursive: true });
    }

    // 生成overview.md
    await this.generateOverview(moduleDir, moduleName, moduleData);

    // 生成api.md
    await this.generateApiReference(moduleDir, moduleName, moduleData);

    // 生成classes.md
    await this.generateClassesDoc(moduleDir, moduleName, moduleData);

    // 生成best-practices.md
    await this.generateBestPractices(moduleDir, moduleName, moduleData);

    // 生成examples.md
    await this.generateExamples(moduleDir, moduleName, moduleData);
  }

  private async generateOverview(moduleDir: string, moduleName: string, moduleData: ModuleData): Promise<void> {
    const deps = moduleData.dependencies;
    const now = new Date();
    
    let content = `# ${moduleName} 模块概览

## 基本信息

- **模块名称**: ${moduleName}
- **路径**: ${moduleData.path}
- **类别**: ${moduleData.category}
- **引擎版本**: ${this.engineVersion}
- **文档生成时间**: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

## 模块描述

${moduleData.description || '暂无描述'}

## 依赖关系

### 公共依赖 (Public Dependencies)
`;

    if (deps.public && deps.public.length > 0) {
      for (const dep of deps.public) {
        content += `- [${dep}](../${dep}/overview.md)\n`;
      }
    } else {
      content += '- 无\n';
    }

    content += '\n### 私有依赖 (Private Dependencies)\n';
    if (deps.private && deps.private.length > 0) {
      for (const dep of deps.private) {
        content += `- ${dep}\n`;
      }
    } else {
      content += '- 无\n';
    }

    content += '\n### 动态加载依赖 (Dynamic Dependencies)\n';
    if (deps.dynamic && deps.dynamic.length > 0) {
      for (const dep of deps.dynamic) {
        content += `- ${dep}\n`;
      }
    } else {
      content += '- 无\n';
    }

    content += `
## 统计信息

- **类数量**: ${moduleData.classes.length}
- **函数数量**: ${moduleData.functions.length}
- **枚举数量**: ${moduleData.enums.length}
- **结构体数量**: ${moduleData.structs.length}

## 相关文档

- [API参考](api.md)
- [类文档](classes.md)
- [最佳实践](best-practices.md)
- [使用示例](examples.md)
`;

    await writeFile(join(moduleDir, 'overview.md'), content, 'utf-8');
  }

  private async generateApiReference(moduleDir: string, moduleName: string, moduleData: ModuleData): Promise<void> {
    let content = `# ${moduleName} API参考

## 概述

本文档包含${moduleName}模块的所有公共API接口。

> **注意**: 本文档仅包含公共API函数，宏定义和内部实现细节已过滤。

## 函数

`;

    const functions = moduleData.functions;
    if (functions.length > 0) {
      const maxFunctions = 500;
      if (functions.length > maxFunctions) {
        content += `> **提示**: 本模块共有 ${functions.length} 个函数，此处仅显示前 ${maxFunctions} 个。完整列表请查看JSON数据文件。\n\n`;
        const limitedFunctions = functions.slice(0, maxFunctions);
        for (const func of limitedFunctions) {
          content += this.formatFunction(func);
        }
      } else {
        for (const func of functions) {
          content += this.formatFunction(func);
        }
      }
    } else {
      content += '暂无函数定义。\n';
    }

    content += '\n## 枚举\n\n';
    const enums = moduleData.enums;
    if (enums.length > 0) {
      for (const enumItem of enums) {
        content += this.formatEnum(enumItem);
      }
    } else {
      content += '暂无枚举定义。\n';
    }

    content += '\n## 结构体\n\n';
    const structs = moduleData.structs;
    if (structs.length > 0) {
      for (const struct of structs) {
        content += this.formatStruct(struct);
      }
    } else {
      content += '暂无结构体定义。\n';
    }

    await writeFile(join(moduleDir, 'api.md'), content, 'utf-8');
  }

  private async generateClassesDoc(moduleDir: string, moduleName: string, moduleData: ModuleData): Promise<void> {
    let content = `# ${moduleName} 类文档

## 概述

本文档包含${moduleName}模块中所有类的详细信息。

`;

    const classes = moduleData.classes;
    if (classes.length > 0) {
      for (const cls of classes) {
        content += this.formatClass(cls);
      }
    } else {
      content += '暂无类定义。\n';
    }

    await writeFile(join(moduleDir, 'classes.md'), content, 'utf-8');
  }

  private async generateBestPractices(moduleDir: string, moduleName: string, moduleData: ModuleData): Promise<void> {
    const practices = this.practicesExtractor.extractFromModule(moduleData);
    const practicesContent = this.practicesExtractor.formatPracticesMarkdown(practices);

    const content = `# ${moduleName} 最佳实践

## 概述

本文档包含使用${moduleName}模块的最佳实践建议。

${practicesContent}
`;

    await writeFile(join(moduleDir, 'best-practices.md'), content, 'utf-8');
  }

  private async generateExamples(moduleDir: string, moduleName: string, moduleData: ModuleData): Promise<void> {
    const examples = this.exampleExtractor.generateUsageExamples(moduleData);
    const examplesContent = this.exampleExtractor.formatExamplesMarkdown(examples);

    const content = `# ${moduleName} 使用示例

## 概述

本文档包含${moduleName}模块的常见使用示例。

${examplesContent}

## 更多示例

更多详细示例请参考：
- UE5官方文档
- 引擎示例项目
- 模块源码中的注释和测试代码

`;

    await writeFile(join(moduleDir, 'examples.md'), content, 'utf-8');
  }

  private formatFunction(func: ModuleData['functions'][0]): string {
    const paramsList = func.parameters;
    let params = '';
    if (paramsList.length > 0) {
      params = paramsList.map(p => `${p.type} ${p.name}`).join(', ');
    }

    const staticStr = func.isStatic ? 'static ' : '';
    const virtualStr = func.isVirtual ? 'virtual ' : '';
    let returnType = func.returnType;

    // 清理返回类型
    returnType = returnType.replace(/\s+/g, ' ').trim();
    if (returnType.startsWith('CORE_API') || returnType.startsWith('ENGINE_API')) {
      const parts = returnType.split(' ');
      returnType = parts.length > 1 ? parts.slice(1).join(' ') : 'void';
    }

    return `### ${staticStr}${virtualStr}${func.name}

\`\`\`cpp
${returnType} ${func.name}(${params});
\`\`\`

- **返回类型**: \`${returnType}\`
- **参数**: ${params || '无'}
- **文件**: \`${func.filePath}\`

`;
  }

  private formatEnum(enumItem: ModuleData['enums'][0]): string {
    let content = `### ${enumItem.name}

\`\`\`cpp
enum ${enumItem.name} {
`;

    for (const value of enumItem.values) {
      if (value.value) {
        content += `    ${value.name} = ${value.value},\n`;
      } else {
        content += `    ${value.name},\n`;
      }
    }

    content += `};
\`\`\`

- **文件**: \`${enumItem.filePath}\`

`;

    return content;
  }

  private formatStruct(struct: ModuleData['structs'][0]): string {
    return `### ${struct.name}

- **文件**: \`${struct.filePath}\`

`;
  }

  private formatClass(cls: ModuleData['classes'][0]): string {
    const baseClasses = cls.baseClasses.join(', ');
    const inheritance = baseClasses ? ` : public ${baseClasses}` : '';
    const members = cls.members;

    let content = `## ${cls.name}

\`\`\`cpp
class ${cls.name}${inheritance} {
    // ...
};
\`\`\`

- **基类**: ${baseClasses || '无'}
- **文件**: \`${cls.filePath}\`

`;

    // 添加成员函数信息
    if (members.length > 0) {
      content += '\n### 主要成员函数\n\n';
      const functionMembers = members.filter(m => m.type === 'function').slice(0, 5);
      for (const member of functionMembers) {
        content += `- \`${member.name}()\`\n`;
      }
    }

    content += '\n';
    return content;
  }

  async generateIndex(allModules: ModuleData[]): Promise<void> {
    const now = new Date();
    let content = `# UE5.1 引擎API文档索引

## 概述

本文档是UE5.1引擎源码API文档的总索引。文档基于引擎源码自动生成，包含所有模块的API参考、类文档、最佳实践和使用示例。

- **引擎版本**: ${this.engineVersion}
- **生成时间**: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
- **模块总数**: ${allModules.length}

## 模块列表

### Runtime模块

`;

    const runtimeModules = allModules.filter(m => m.category === 'Runtime');
    for (const module of runtimeModules.sort((a, b) => a.name.localeCompare(b.name))) {
      content += `- [${module.name}](modules/${module.name}/overview.md)\n`;
    }

    content += '\n### Editor模块\n\n';
    const editorModules = allModules.filter(m => m.category === 'Editor');
    for (const module of editorModules.sort((a, b) => a.name.localeCompare(b.name))) {
      content += `- [${module.name}](modules/${module.name}/overview.md)\n`;
    }

    content += '\n### Developer模块\n\n';
    const developerModules = allModules.filter(m => m.category === 'Developer');
    for (const module of developerModules.sort((a, b) => a.name.localeCompare(b.name))) {
      content += `- [${module.name}](modules/${module.name}/overview.md)\n`;
    }

    content += '\n### Programs模块\n\n';
    const programsModules = allModules.filter(m => m.category === 'Programs');
    for (const module of programsModules.sort((a, b) => a.name.localeCompare(b.name))) {
      content += `- [${module.name}](modules/${module.name}/overview.md)\n`;
    }

    const pluginsModules = allModules.filter(m => m.category === 'Plugins');
    if (pluginsModules.length > 0) {
      content += '\n### Plugins模块\n\n';
      for (const module of pluginsModules.sort((a, b) => a.name.localeCompare(b.name))) {
        content += `- [${module.name}](modules/${module.name}/overview.md)\n`;
      }
    }

    content += `
## 使用说明

1. 浏览模块列表，找到你需要的模块
2. 查看模块概览了解模块用途和依赖关系
3. 参考API文档了解具体的接口
4. 查看类文档了解类的继承关系和使用方法
5. 参考最佳实践和使用示例学习如何正确使用

## 文档结构

每个模块的文档包含以下部分：

- **overview.md**: 模块概览、依赖关系、统计信息
- **api.md**: 所有公共API的详细说明
- **classes.md**: 类的继承关系、成员函数、属性
- **best-practices.md**: 基于代码分析的最佳实践
- **examples.md**: 常见使用场景的代码示例

## 注意事项

- 本文档基于引擎源码自动生成，可能存在解析不准确的情况
- 建议结合官方文档和示例代码使用
- 文档使用相对路径，不依赖引擎源码的绝对路径
`;

    await writeFile(join(this.outputDir, 'index.md'), content, 'utf-8');
  }

  async generateReadme(): Promise<void> {
    const now = new Date();
    const content = `# UE5.1 引擎API文档

## 概述

本文档集合包含UE5.1引擎源码的完整API文档，由自动化工具生成。

## 文档结构

\`\`\`
docs/ue5-api/
├── modules/          # 按模块组织的文档
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
└── README.md         # 本文件
\`\`\`

## 使用方式

### 浏览文档

1. 打开 \`index.md\` 查看所有模块列表
2. 选择需要的模块，查看其文档
3. 使用Markdown阅读器或GitHub查看文档

### 程序化查询

使用 \`data/\` 目录下的JSON文件进行程序化查询：

\`\`\`javascript
// 加载模块索引
const modules = require('./data/modules.json');

// 查找特定模块
const coreModule = modules.modules.find(m => m.name === 'Core');
\`\`\`

## 路径说明

文档中所有路径引用使用相对路径格式：
- \`Engine/Source/Runtime/Core\`
- \`Engine/Source/Editor/LevelEditor\`

不包含绝对路径，可以在不同环境中使用。

## 版本信息

- **引擎版本**: ${this.engineVersion}
- **文档生成工具**: generate-ue5-docs (Node.js/TypeScript)
- **生成时间**: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

## 更新说明

文档可以通过运行生成工具重新生成。工具支持增量更新，仅更新变更的模块。

## 反馈

如发现文档问题，请检查源码或联系维护人员。
`;

    await writeFile(join(this.outputDir, 'README.md'), content, 'utf-8');
  }
}
