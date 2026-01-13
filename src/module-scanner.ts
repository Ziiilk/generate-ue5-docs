/**
 * 模块扫描器：扫描Engine/Source目录，识别所有模块
 */
import { readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { ModuleInfo } from './types.js';

export class ModuleScanner {
  private sourceDir: string;
  private categories: string[];
  private excludeDirs: string[];
  private modules: ModuleInfo[] = [];

  constructor(sourceDir: string, categories: string[], excludeDirs: string[]) {
    this.sourceDir = resolve(sourceDir);
    this.categories = categories;
    this.excludeDirs = excludeDirs;
  }

  async scan(): Promise<ModuleInfo[]> {
    this.modules = [];

    for (const category of this.categories) {
      const categoryPath = join(this.sourceDir, category);
      
      if (!existsSync(categoryPath)) {
        continue;
      }

      try {
        const entries = await readdir(categoryPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (!entry.isDirectory()) {
            continue;
          }

          // 跳过排除的目录
          if (this.excludeDirs.includes(entry.name)) {
            continue;
          }

          const moduleDir = join(categoryPath, entry.name);
          const buildCsPath = join(moduleDir, `${entry.name}.Build.cs`);

          if (existsSync(buildCsPath)) {
            const moduleInfo = await this.parseModule(moduleDir, category, buildCsPath, entry.name);
            if (moduleInfo) {
              this.modules.push(moduleInfo);
            }
          }
        }
      } catch (error) {
        console.warn(`Error scanning category ${category}: ${error}`);
      }
    }

    return this.modules;
  }

  private async parseModule(
    moduleDir: string,
    category: string,
    buildCsPath: string,
    moduleName: string
  ): Promise<ModuleInfo | null> {
    const publicDir = join(moduleDir, 'Public');
    const privateDir = join(moduleDir, 'Private');

    // Public目录可能不存在（某些模块只有Private）
    if (!existsSync(publicDir) && !existsSync(privateDir)) {
      return null;
    }

    // 获取相对路径（Engine/Source/...格式）
    const relativePath = this.getRelativePath(moduleDir);

    return {
      name: moduleName,
      path: relativePath,
      category: category,
      buildCsPath: buildCsPath,
      publicDir: existsSync(publicDir) ? publicDir : undefined,
      privateDir: existsSync(privateDir) ? privateDir : undefined,
    };
  }

  private getRelativePath(absolutePath: string): string {
    try {
      const parts = absolutePath.split(/[/\\]/);
      const engineIdx = parts.indexOf('Engine');
      
      if (engineIdx !== -1) {
        return parts.slice(engineIdx).join('/');
      }
      
      // 如果找不到Engine，尝试相对于sourceDir
      const sourceParts = this.sourceDir.split(/[/\\]/);
      const relativeParts: string[] = [];
      let i = 0;
      
      while (i < sourceParts.length && i < parts.length && sourceParts[i] === parts[i]) {
        i++;
      }
      
      return parts.slice(i).join('/');
    } catch {
      return absolutePath;
    }
  }

  getModuleCount(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const category of this.categories) {
      stats[category] = this.modules.filter(m => m.category === category).length;
    }
    
    return stats;
  }
}
