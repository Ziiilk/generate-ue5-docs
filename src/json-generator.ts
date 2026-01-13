/**
 * JSON文档生成器：生成结构化数据文件
 */
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { ModuleData } from './types.js';

export class JSONGenerator {
  private outputDir: string;
  private engineVersion: string;
  private dataDir: string;

  constructor(outputDir: string, engineVersion: string) {
    this.outputDir = outputDir;
    this.engineVersion = engineVersion;
    this.dataDir = join(outputDir, 'data');
  }

  async initialize(): Promise<void> {
    if (!existsSync(this.dataDir)) {
      await mkdir(this.dataDir, { recursive: true });
    }
  }

  async generateModulesIndex(allModules: ModuleData[]): Promise<void> {
    await this.initialize();

    const modulesData = {
      version: this.engineVersion,
      generated_at: new Date().toISOString(),
      module_count: allModules.length,
      modules: allModules.map(m => ({
        name: m.name,
        path: m.path,
        category: m.category,
        dependencies: m.dependencies,
        class_count: m.classes.length,
        function_count: m.functions.length,
        enum_count: m.enums.length,
        struct_count: m.structs.length,
      })),
    };

    await writeFile(
      join(this.dataDir, 'modules.json'),
      JSON.stringify(modulesData, null, 2),
      'utf-8'
    );
  }

  async generateApiIndex(allModules: ModuleData[]): Promise<void> {
    await this.initialize();

    const apiIndex = {
      version: this.engineVersion,
      generated_at: new Date().toISOString(),
      classes: [] as Array<{
        name: string;
        module: string;
        base_classes: string[];
        file_path: string;
      }>,
      functions: [] as Array<{
        name: string;
        module: string;
        return_type: string;
        file_path: string;
      }>,
      enums: [] as Array<{
        name: string;
        module: string;
        file_path: string;
      }>,
      structs: [] as Array<{
        name: string;
        module: string;
        file_path: string;
      }>,
    };

    for (const module of allModules) {
      const moduleName = module.name;

      // 索引类
      for (const cls of module.classes) {
        apiIndex.classes.push({
          name: cls.name,
          module: moduleName,
          base_classes: cls.baseClasses,
          file_path: cls.filePath,
        });
      }

      // 索引函数
      for (const func of module.functions) {
        apiIndex.functions.push({
          name: func.name,
          module: moduleName,
          return_type: func.returnType,
          file_path: func.filePath,
        });
      }

      // 索引枚举
      for (const enumItem of module.enums) {
        apiIndex.enums.push({
          name: enumItem.name,
          module: moduleName,
          file_path: enumItem.filePath,
        });
      }

      // 索引结构体
      for (const struct of module.structs) {
        apiIndex.structs.push({
          name: struct.name,
          module: moduleName,
          file_path: struct.filePath,
        });
      }
    }

    await writeFile(
      join(this.dataDir, 'api-index.json'),
      JSON.stringify(apiIndex, null, 2),
      'utf-8'
    );
  }

  async generateModuleData(moduleName: string, moduleData: ModuleData): Promise<void> {
    await this.initialize();

    const moduleJson = {
      version: this.engineVersion,
      generated_at: new Date().toISOString(),
      module: {
        name: moduleName,
        path: moduleData.path,
        category: moduleData.category,
        dependencies: moduleData.dependencies,
        classes: moduleData.classes,
        functions: moduleData.functions,
        enums: moduleData.enums,
        structs: moduleData.structs,
      },
    };

    const outputFile = join(this.dataDir, `${moduleName}.json`);
    await writeFile(
      outputFile,
      JSON.stringify(moduleJson, null, 2),
      'utf-8'
    );
  }
}
