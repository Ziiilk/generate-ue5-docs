/**
 * 示例提取器：从代码中提取使用示例模式
 */
import { ModuleData, Example } from './types.js';

export class ExampleExtractor {
  generateUsageExamples(moduleData: ModuleData): Example[] {
    const examples: Example[] = [];
    const moduleName = moduleData.name;

    // 为类生成基本使用示例
    const classes = moduleData.classes.slice(0, 5); // 只取前5个类
    for (const cls of classes) {
      const className = cls.name;
      if (className) {
        const example = this.generateClassExample(className, cls);
        if (example) {
          examples.push(example);
        }
      }
    }

    // 为常用函数生成示例
    const functions = moduleData.functions.slice(0, 5); // 只取前5个函数
    for (const func of functions) {
      const funcName = func.name;
      if (funcName && !funcName.startsWith('_')) {
        // 跳过私有函数
        const example = this.generateFunctionExample(funcName, func);
        if (example) {
          examples.push(example);
        }
      }
    }

    return examples;
  }

  private generateClassExample(className: string, clsInfo: ModuleData['classes'][0]): Example | null {
    const exampleCode = `// 使用 ${className} 类
${className}* Instance = NewObject<${className}>();
// 使用实例...
`;

    return {
      type: 'generated',
      title: `使用 ${className} 类`,
      code: exampleCode,
      description: `创建和使用${className}类的基本示例`,
    };
  }

  private generateFunctionExample(funcName: string, funcInfo: ModuleData['functions'][0]): Example | null {
    const params = funcInfo.parameters;
    const returnType = funcInfo.returnType;

    // 构建参数列表
    const paramNames = params.map((p, i) => p.name || `param${i}`);
    const paramList = paramNames.join(', ');

    let exampleCode: string;
    if (returnType === 'void') {
      exampleCode = `// 调用 ${funcName} 函数
${funcName}(${paramList});
`;
    } else {
      exampleCode = `// 调用 ${funcName} 函数
${returnType} Result = ${funcName}(${paramList});
// 使用返回值...
`;
    }

    return {
      type: 'generated',
      title: `调用 ${funcName} 函数`,
      code: exampleCode,
      description: `调用${funcName}函数的基本示例`,
    };
  }

  formatExamplesMarkdown(examples: Example[]): string {
    if (examples.length === 0) {
      return '暂无使用示例。\n';
    }

    let content = '## 使用示例\n\n';

    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      const title = example.title || `示例 ${i + 1}`;
      const code = example.code;
      const description = example.description;

      content += `### ${title}\n\n`;
      if (description) {
        content += `${description}\n\n`;
      }
      content += '```cpp\n';
      content += code;
      content += '```\n\n';
    }

    return content;
  }
}
