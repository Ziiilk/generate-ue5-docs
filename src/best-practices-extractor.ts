/**
 * 最佳实践提取器：分析代码模式，提取最佳实践
 */
import { ModuleData, BestPractice } from './types.js';

export class BestPracticesExtractor {
  extractFromModule(moduleData: ModuleData): BestPractice[] {
    const practices: BestPractice[] = [];
    const moduleName = moduleData.name;

    // 基于模块类型提取实践
    const category = moduleData.category;

    if (category === 'Runtime') {
      practices.push(...this.getRuntimePractices(moduleName));
    } else if (category === 'Editor') {
      practices.push(...this.getEditorPractices(moduleName));
    }

    // 基于API模式提取实践
    practices.push(...this.extractApiPractices(moduleData));

    return practices;
  }

  private getRuntimePractices(moduleName: string): BestPractice[] {
    const practices: BestPractice[] = [];

    if (moduleName === 'Core') {
      practices.push({
        title: '使用智能指针管理内存',
        description: '优先使用TSharedPtr、TUniquePtr等智能指针，避免手动内存管理',
        category: '内存管理',
      });
      practices.push({
        title: '使用容器类',
        description: '使用TArray、TMap等UE5容器类，而不是STL容器',
        category: '容器使用',
      });
    }

    return practices;
  }

  private getEditorPractices(moduleName: string): BestPractice[] {
    const practices: BestPractice[] = [];

    practices.push({
      title: '编辑器工具开发',
      description: '使用EditorSubsystem和EditorUtilityWidget开发编辑器工具',
      category: '编辑器开发',
    });

    return practices;
  }

  private extractApiPractices(moduleData: ModuleData): BestPractice[] {
    const practices: BestPractice[] = [];

    // 检查是否有单例模式
    const classes = moduleData.classes;
    for (const cls of classes) {
      const className = cls.name;
      // 简单的单例检测（名称包含Singleton或Manager）
      if (className.includes('Singleton') || className.includes('Manager')) {
        practices.push({
          title: `使用 ${className} 单例`,
          description: `${className}采用单例模式，使用Get()方法获取实例`,
          category: '设计模式',
        });
      }
    }

    return practices;
  }

  formatPracticesMarkdown(practices: BestPractice[]): string {
    if (practices.length === 0) {
      return `## 最佳实践

本文档正在完善中，将基于代码分析提取最佳实践模式。

### 通用建议

1. 参考官方文档和示例代码
2. 遵循UE5编码规范
3. 注意模块依赖关系
4. 使用UE5的反射系统和宏系统

`;
    }

    let content = '## 最佳实践\n\n';

    // 按类别分组
    const categories: Record<string, BestPractice[]> = {};
    for (const practice of practices) {
      const category = practice.category || '其他';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(practice);
    }

    // 输出每个类别
    for (const [category, items] of Object.entries(categories)) {
      content += `### ${category}\n\n`;
      for (const practice of items) {
        const title = practice.title;
        const description = practice.description;
        content += `#### ${title}\n\n`;
        content += `${description}\n\n`;
      }
    }

    return content;
  }
}
