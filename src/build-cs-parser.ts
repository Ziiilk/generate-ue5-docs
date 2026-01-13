/**
 * Build.cs解析器：解析模块的.Build.cs文件，提取依赖关系
 */
import { readFile } from 'fs/promises';
import { Dependencies } from './types.js';

export class BuildCSParser {
  private buildCsPath: string;
  private content: string = '';

  constructor(buildCsPath: string) {
    this.buildCsPath = buildCsPath;
  }

  async readFile(): Promise<void> {
    try {
      this.content = await readFile(this.buildCsPath, 'utf-8');
    } catch (error) {
      console.warn(`Error reading ${this.buildCsPath}: ${error}`);
      this.content = '';
    }
  }

  async parseDependencies(): Promise<Dependencies> {
    if (!this.content) {
      await this.readFile();
    }

    const dependencies: Dependencies = {
      public: [],
      private: [],
      dynamic: [],
    };

    // 匹配 PublicDependencyModuleNames.AddRange 或 .Add()
    const publicPattern = /PublicDependencyModuleNames\.(?:AddRange\s*\(\s*new\s+string\[\]\s*\{([^}]+)\}|Add\s*\(\s*"([^"]+)"\s*\))/g;
    const privatePattern = /PrivateDependencyModuleNames\.(?:AddRange\s*\(\s*new\s+string\[\]\s*\{([^}]+)\}|Add\s*\(\s*"([^"]+)"\s*\))/g;
    const dynamicPattern = /DynamicallyLoadedModuleNames\.(?:AddRange\s*\(\s*new\s+string\[\]\s*\{([^}]+)\}|Add\s*\(\s*"([^"]+)"\s*\))/g;

    // 提取Public依赖
    let match;
    while ((match = publicPattern.exec(this.content)) !== null) {
      if (match[1]) {
        // AddRange格式
        const deps = this.parseStringArray(match[1]);
        dependencies.public.push(...deps);
      } else if (match[2]) {
        // Add格式
        dependencies.public.push(match[2]);
      }
    }

    // 提取Private依赖
    while ((match = privatePattern.exec(this.content)) !== null) {
      if (match[1]) {
        const deps = this.parseStringArray(match[1]);
        dependencies.private.push(...deps);
      } else if (match[2]) {
        dependencies.private.push(match[2]);
      }
    }

    // 提取Dynamic依赖
    while ((match = dynamicPattern.exec(this.content)) !== null) {
      if (match[1]) {
        const deps = this.parseStringArray(match[1]);
        dependencies.dynamic.push(...deps);
      } else if (match[2]) {
        dependencies.dynamic.push(match[2]);
      }
    }

    // 去重
    dependencies.public = [...new Set(dependencies.public)];
    dependencies.private = [...new Set(dependencies.private)];
    dependencies.dynamic = [...new Set(dependencies.dynamic)];

    return dependencies;
  }

  private parseStringArray(content: string): string[] {
    // 匹配 "ModuleName" 格式
    const pattern = /"([^"]+)"/g;
    const matches: string[] = [];
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      matches.push(match[1]);
    }
    
    return matches;
  }

  async getModuleName(): Promise<string> {
    if (!this.content) {
      await this.readFile();
    }

    // 匹配 public class ModuleName : ModuleRules
    const match = this.content.match(/public\s+class\s+(\w+)\s*:\s*ModuleRules/);
    return match ? match[1] : '';
  }
}
