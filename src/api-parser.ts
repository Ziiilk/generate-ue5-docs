/**
 * API解析器：解析C++头文件，提取API信息
 */
import { readdir, readFile, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { APIData, ClassInfo, FunctionInfo, EnumInfo, StructInfo } from './types.js';

export class APIParser {
  private publicDir: string;
  private classes: ClassInfo[] = [];
  private functions: FunctionInfo[] = [];
  private enums: EnumInfo[] = [];
  private structs: StructInfo[] = [];

  constructor(publicDir: string) {
    this.publicDir = resolve(publicDir);
  }

  async parse(): Promise<APIData> {
    if (!existsSync(this.publicDir)) {
      return this.getResult();
    }

    // 递归查找所有.h文件
    const headerFiles = await this.findHeaderFiles(this.publicDir);

    for (const headerFile of headerFiles) {
      // 跳过generated.h文件
      if (headerFile.endsWith('.generated.h')) {
        continue;
      }

      await this.parseFile(headerFile);
    }

    return this.getResult();
  }

  private async findHeaderFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.findHeaderFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.h')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${dir}: ${error}`);
    }
    
    return files;
  }

  private async parseFile(filePath: string): Promise<void> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const relativePath = this.getRelativePath(filePath);

      // 解析类
      this.parseClasses(content, relativePath);

      // 解析函数
      this.parseFunctions(content, relativePath);

      // 解析枚举
      this.parseEnums(content, relativePath);

      // 解析结构体
      this.parseStructs(content, relativePath);
    } catch (error) {
      console.warn(`Error parsing ${filePath}: ${error}`);
    }
  }

  private parseClasses(content: string, filePath: string): void {
    // 匹配 class ClassName : public BaseClass
    const pattern = /class\s+(?:CORE_API|ENGINE_API|[\w_]+_API)?\s*(\w+)(?:\s*:\s*(?:public|protected|private)\s+([\w\s,<>:]+))?/g;

    let match;
    while ((match = pattern.exec(content)) !== null) {
      const className = match[1];
      const baseClassesStr = match[2] || '';

      // 解析基类列表
      const baseClasses: string[] = [];
      if (baseClassesStr) {
        // 简单解析，提取类名
        const baseMatches = baseClassesStr.matchAll(/(\w+(?:<[^>]+>)?)/g);
        for (const baseMatch of baseMatches) {
          const baseName = baseMatch[1];
          if (baseName && !['public', 'protected', 'private'].includes(baseName)) {
            baseClasses.push(baseName);
          }
        }
      }

      const classInfo: ClassInfo = {
        name: className,
        baseClasses: baseClasses,
        access: 'public',
        members: [],
        filePath: filePath,
      };
      this.classes.push(classInfo);
    }
  }

  private parseFunctions(content: string, filePath: string): void {
    // 排除宏定义
    const macroPatterns = [
      /DECLARE_/,
      /DEFINE_/,
      /IMPLEMENT_/,
      /BEGIN_/,
      /END_/,
      /GENERATED_/,
      /UCLASS\(/,
      /USTRUCT\(/,
      /UENUM\(/,
      /UFUNCTION\(/,
      /UPROPERTY\(/,
    ];

    // 匹配函数声明
    const pattern = /(?:static\s+|virtual\s+|inline\s+|extern\s+)?(?:CORE_API|ENGINE_API|[\w_]+_API)?\s*([\w<>:,\s*&\[\]()]+?)\s+(\w+)\s*\(([^)]*)\)\s*;/g;

    let match;
    while ((match = pattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const funcName = match[2];
      let returnTypeRaw = match[1].trim();

      // 跳过宏定义
      let isMacro = false;
      for (const macroPattern of macroPatterns) {
        if (macroPattern.test(fullMatch)) {
          isMacro = true;
          break;
        }
      }

      // 跳过全大写且包含多个下划线的名称（通常是宏）
      if (!isMacro && funcName === funcName.toUpperCase() && (funcName.match(/_/g) || []).length >= 2) {
        isMacro = true;
      }

      if (isMacro) {
        continue;
      }

      // 清理返回类型
      returnTypeRaw = returnTypeRaw.replace(/#\w+.*/g, ''); // 移除预处理指令
      returnTypeRaw = returnTypeRaw.replace(/\/\/.*/g, ''); // 移除行注释
      returnTypeRaw = returnTypeRaw.replace(/\/\*.*?\*\//gs, ''); // 移除块注释
      returnTypeRaw = returnTypeRaw.replace(/\s+/g, ' ').trim(); // 移除多余空白

      // 跳过返回类型为空或无效的情况
      if (!returnTypeRaw || returnTypeRaw === 'CORE_API' || returnTypeRaw === 'ENGINE_API' || returnTypeRaw.length > 200) {
        continue;
      }

      // 如果返回类型包含明显的注释内容，跳过
      if (returnTypeRaw.toLowerCase().includes('optional') || returnTypeRaw.toLowerCase().includes('should be')) {
        continue;
      }

      const paramsStr = match[3];

      // 解析参数
      const parameters = this.parseParameters(paramsStr);

      // 检查是否为static或virtual
      const isStatic = fullMatch.includes('static');
      const isVirtual = fullMatch.includes('virtual');

      const funcInfo: FunctionInfo = {
        name: funcName,
        returnType: returnTypeRaw,
        parameters: parameters,
        access: 'public',
        isStatic: isStatic,
        isVirtual: isVirtual,
        filePath: filePath,
      };
      this.functions.push(funcInfo);
    }
  }

  private parseEnums(content: string, filePath: string): void {
    // 匹配 enum EnumName { ... } 或 enum class EnumName { ... }
    const pattern = /enum\s+(?:class\s+)?(\w+)\s*\{([^}]+)\}/gs;

    let match;
    while ((match = pattern.exec(content)) !== null) {
      const enumName = match[1];
      const valuesStr = match[2];

      // 解析枚举值
      const values: Array<{ name: string; value: string }> = [];
      const valuePattern = /(\w+)(?:\s*=\s*([^,}]+))?/g;
      
      let valueMatch;
      while ((valueMatch = valuePattern.exec(valuesStr)) !== null) {
        const valueName = valueMatch[1];
        const valueValue = (valueMatch[2] || '').trim();
        values.push({
          name: valueName,
          value: valueValue,
        });
      }

      const enumInfo: EnumInfo = {
        name: enumName,
        values: values,
        filePath: filePath,
      };
      this.enums.push(enumInfo);
    }
  }

  private parseStructs(content: string, filePath: string): void {
    // 匹配 struct StructName { ... }
    const pattern = /struct\s+(?:CORE_API|ENGINE_API|[\w_]+_API)?\s*(\w+)(?:\s*:\s*([\w\s,<>:]+))?\s*\{/g;

    let match;
    while ((match = pattern.exec(content)) !== null) {
      const structName = match[1];

      const structInfo: StructInfo = {
        name: structName,
        members: [],
        filePath: filePath,
      };
      this.structs.push(structInfo);
    }
  }

  private parseParameters(paramsStr: string): Array<{ name: string; type: string }> {
    if (!paramsStr.trim()) {
      return [];
    }

    const parameters: Array<{ name: string; type: string }> = [];
    
    // 按逗号分割（但要考虑模板参数中的逗号）
    const paramParts: string[] = [];
    let depth = 0;
    let currentParam = '';

    for (const char of paramsStr) {
      if (char === '<') {
        depth++;
        currentParam += char;
      } else if (char === '>') {
        depth--;
        currentParam += char;
      } else if (char === ',' && depth === 0) {
        if (currentParam.trim()) {
          paramParts.push(currentParam.trim());
        }
        currentParam = '';
      } else {
        currentParam += char;
      }
    }

    if (currentParam.trim()) {
      paramParts.push(currentParam.trim());
    }

    // 解析每个参数
    for (const paramStr of paramParts) {
      // 移除默认值
      const paramWithoutDefault = paramStr.replace(/\s*=\s*.*$/, '');
      
      // 匹配：类型 参数名
      const paramMatch = paramWithoutDefault.trim().match(/^(.+?)\s+(\w+)$/);
      if (paramMatch) {
        let paramType = paramMatch[1].trim();
        const paramName = paramMatch[2];
        
        // 清理类型（移除多余空格）
        paramType = paramType.replace(/\s+/g, ' ');
        
        parameters.push({
          name: paramName,
          type: paramType,
        });
      } else {
        // 如果没有参数名（只有类型），也记录
        if (paramWithoutDefault.trim()) {
          parameters.push({
            name: '',
            type: paramWithoutDefault.trim(),
          });
        }
      }
    }

    return parameters;
  }

  private getRelativePath(filePath: string): string {
    // 查找Engine/Source在路径中的位置
    const parts = filePath.split(/[/\\]/);
    try {
      const engineIdx = parts.indexOf('Engine');
      if (engineIdx !== -1) {
        return parts.slice(engineIdx).join('/');
      }
    } catch {
      // 忽略错误
    }
    return filePath;
  }

  private getResult(): APIData {
    return {
      classes: this.classes,
      functions: this.functions,
      enums: this.enums,
      structs: this.structs,
    };
  }
}
