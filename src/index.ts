#!/usr/bin/env node
/**
 * UE5 API文档生成工具主程序
 */
import { Command } from 'commander';
import { resolve, join } from 'path';
import { existsSync } from 'fs';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { createRequire } from 'module';
import { ModuleScanner } from './module-scanner.js';
import { BuildCSParser } from './build-cs-parser.js';
import { APIParser } from './api-parser.js';
import { MarkdownGenerator } from './markdown-generator.js';
import { JSONGenerator } from './json-generator.js';
import { getConfig, DEFAULT_CONFIG } from './config.js';
import { ModuleData, APIData } from './types.js';

// 从 package.json 读取版本号
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

interface LogOptions {
  logFile?: string;
  verbose?: boolean;
}

class Logger {
  private logFile?: string;
  private verbose: boolean;

  constructor(options: LogOptions = {}) {
    this.logFile = options.logFile;
    this.verbose = options.verbose || false;
  }

  async log(level: string, message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${level} - ${message}`;

    if (this.verbose || level === 'ERROR') {
      console.log(logMessage);
    }

    if (this.logFile) {
      try {
        await writeFile(this.logFile, logMessage + '\n', { flag: 'a' });
      } catch (error) {
        // 忽略日志文件写入错误
      }
    }
  }

  info(message: string): Promise<void> {
    return this.log('INFO', message);
  }

  warn(message: string): Promise<void> {
    return this.log('WARN', message);
  }

  error(message: string): Promise<void> {
    return this.log('ERROR', message);
  }
}

function getRelativePath(absolutePath: string, sourceDir: string): string {
  try {
    const parts = absolutePath.split(/[/\\]/);
    const engineIdx = parts.indexOf('Engine');

    if (engineIdx !== -1) {
      return parts.slice(engineIdx).join('/');
    }

    // 如果找不到Engine，尝试相对于sourceDir
    const sourceParts = sourceDir.split(/[/\\]/);
    let i = 0;
    while (i < sourceParts.length && i < parts.length && sourceParts[i] === parts[i]) {
      i++;
    }
    return parts.slice(i).join('/');
  } catch {
    return absolutePath;
  }
}

async function processModule(
  moduleInfo: Awaited<ReturnType<ModuleScanner['scan']>>[0],
  sourceDir: string
): Promise<ModuleData> {
  console.log(`处理模块: ${moduleInfo.name} (${moduleInfo.category})`);

  // 解析Build.cs文件
  const buildParser = new BuildCSParser(moduleInfo.buildCsPath);
  const dependencies = await buildParser.parseDependencies();

  // 解析API（如果有Public目录）
  let apiData: APIData = {
    classes: [],
    functions: [],
    enums: [],
    structs: [],
  };

  if (moduleInfo.publicDir) {
    const apiParser = new APIParser(moduleInfo.publicDir);
    apiData = await apiParser.parse();
  }

  // 构建模块数据
  const relativePath = getRelativePath(moduleInfo.path, sourceDir);

  return {
    name: moduleInfo.name,
    path: relativePath,
    category: moduleInfo.category,
    dependencies: dependencies,
    classes: apiData.classes,
    functions: apiData.functions,
    enums: apiData.enums,
    structs: apiData.structs,
  };
}

async function main() {
  const program = new Command();

  program
    .name('generate-ue5-docs')
    .description('生成UE5引擎API文档')
    .version(packageJson.version)
    .option('--source-dir <dir>', '引擎源码目录', DEFAULT_CONFIG.sourceDir)
    .option('--plugins-dir <dir>', '插件目录', DEFAULT_CONFIG.pluginsDir)
    .option('--output-dir <dir>', '输出目录', DEFAULT_CONFIG.outputDir)
    .option('--engine-version <version>', '引擎版本', DEFAULT_CONFIG.engineVersion)
    .option('--categories <categories...>', '要处理的模块类别', DEFAULT_CONFIG.moduleCategories)
    .option('--exclude-dirs <dirs...>', '要排除的目录', DEFAULT_CONFIG.excludeDirs)
    .option('--verbose', '显示详细日志', false)
    .parse(process.argv);

  const options = program.opts();
  const config = getConfig({
    sourceDir: options.sourceDir,
    pluginsDir: options.pluginsDir,
    outputDir: options.outputDir,
    engineVersion: options.engineVersion,
    moduleCategories: options.categories,
    excludeDirs: options.excludeDirs,
  });

  const sourceDir = resolve(config.sourceDir);
  const outputDir = resolve(config.outputDir);

  // 设置日志
  const logFile = join(outputDir, 'generation.log');
  await mkdir(outputDir, { recursive: true });

  const logger = new Logger({
    logFile: logFile,
    verbose: options.verbose,
  });

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(sourceDir)) {
    const errorMsg = `错误: 源码目录不存在: ${sourceDir}`;
    await logger.error(errorMsg);
    console.error(errorMsg);
    process.exit(1);
  }

  console.log(`源码目录: ${sourceDir}`);
  if (config.pluginsDir) {
    console.log(`插件目录: ${config.pluginsDir}`);
  }
  console.log(`输出目录: ${outputDir}`);
  console.log(`引擎版本: ${config.engineVersion}`);
  console.log(`处理类别: ${config.moduleCategories.join(', ')}`);
  console.log();

  // 扫描模块
  console.log('扫描模块...');
  const scanner = new ModuleScanner(sourceDir, config.moduleCategories, config.excludeDirs);
  const sourceModules = await scanner.scan();

  // 扫描插件模块
  let pluginModules: Awaited<ReturnType<ModuleScanner['scan']>> = [];
  if (config.pluginsDir) {
    pluginModules = await scanner.scanPlugins(config.pluginsDir);
  }

  // 合并模块
  const modules = [...sourceModules, ...pluginModules];

  // 统计信息
  const stats = scanner.getModuleCount();
  if (pluginModules.length > 0) {
    stats['Plugins'] = pluginModules.length;
  }
  console.log(`找到 ${modules.length} 个模块:`);
  for (const [category, count] of Object.entries(stats)) {
    console.log(`  ${category}: ${count} 个模块`);
  }
  console.log();

  if (modules.length === 0) {
    console.error('错误: 未找到任何模块');
    process.exit(1);
  }

  // 处理所有模块
  console.log('处理模块...');
  await logger.info('开始处理模块');
  const allModulesData: ModuleData[] = [];

  for (const moduleInfo of modules) {
    try {
      const moduleData = await processModule(moduleInfo, sourceDir);
      allModulesData.push(moduleData);
      await logger.info(`成功处理模块: ${moduleInfo.name}`);
    } catch (error) {
      const warningMsg = `警告: 处理模块 ${moduleInfo.name} 时出错: ${error}`;
      warnings.push(warningMsg);
      await logger.warn(warningMsg);
      if (error instanceof Error && error.stack) {
        await logger.warn(error.stack);
      }
      continue;
    }
  }

  console.log(`\n成功处理 ${allModulesData.length} 个模块\n`);

  // 生成文档
  console.log('生成文档...');
  await logger.info('开始生成文档');

  // 创建生成器
  const mdGenerator = new MarkdownGenerator(outputDir, config.engineVersion);
  const jsonGenerator = new JSONGenerator(outputDir, config.engineVersion);

  // 生成每个模块的文档
  for (const moduleData of allModulesData) {
    try {
      console.log(`生成 ${moduleData.name} 模块文档...`);
      await mdGenerator.generateModuleDocs(moduleData.name, moduleData);
      await jsonGenerator.generateModuleData(moduleData.name, moduleData);
      await logger.info(`成功生成模块文档: ${moduleData.name}`);
    } catch (error) {
      const warningMsg = `警告: 生成模块 ${moduleData.name} 文档时出错: ${error}`;
      warnings.push(warningMsg);
      await logger.warn(warningMsg);
      if (error instanceof Error && error.stack) {
        await logger.warn(error.stack);
      }
      continue;
    }
  }

  // 生成索引
  console.log('\n生成索引...');
  await logger.info('生成索引文件');
  try {
    await mdGenerator.generateIndex(allModulesData);
    await mdGenerator.generateReadme();
    await jsonGenerator.generateModulesIndex(allModulesData);
    await jsonGenerator.generateApiIndex(allModulesData);
    await logger.info('成功生成索引文件');
  } catch (error) {
    const errorMsg = `错误: 生成索引时出错: ${error}`;
    errors.push(errorMsg);
    await logger.error(errorMsg);
    if (error instanceof Error && error.stack) {
      await logger.error(error.stack);
    }
  }

  // 生成最终报告
  console.log('\n' + '='.repeat(50));
  console.log('生成完成!');
  console.log('='.repeat(50));
  console.log(`文档已生成到: ${outputDir}`);
  console.log(`  - Markdown文档: ${join(outputDir, 'modules')}`);
  console.log(`  - JSON数据: ${join(outputDir, 'data')}`);
  console.log(`  - 索引文件: ${join(outputDir, 'index.md')}`);
  console.log(`  - 日志文件: ${logFile}`);

  if (warnings.length > 0) {
    console.log(`\n警告 (${warnings.length} 个):`);
    for (const warning of warnings.slice(0, 10)) {
      // 只显示前10个
      console.log(`  - ${warning}`);
    }
    if (warnings.length > 10) {
      console.log(`  ... 还有 ${warnings.length - 10} 个警告，详见日志文件`);
    }
  }

  if (errors.length > 0) {
    console.log(`\n错误 (${errors.length} 个):`);
    for (const error of errors) {
      console.log(`  - ${error}`);
    }
  }

  await logger.info(
    `文档生成完成。成功: ${allModulesData.length}, 警告: ${warnings.length}, 错误: ${errors.length}`
  );

  // 将错误和警告汇总写入报告文件
  const reportFile = join(outputDir, 'generation_report.txt');
  const reportContent = `UE5 API文档生成报告
生成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
引擎版本: ${config.engineVersion}
成功处理模块数: ${allModulesData.length}
警告数: ${warnings.length}
错误数: ${errors.length}

${warnings.length > 0 ? `警告列表:\n${warnings.map(w => `  - ${w}`).join('\n')}\n\n` : ''}
${errors.length > 0 ? `错误列表:\n${errors.map(e => `  - ${e}`).join('\n')}\n` : ''}
`;

  await writeFile(reportFile, reportContent, 'utf-8');
  console.log(`\n详细报告已保存到: ${reportFile}`);
}

// 执行主函数
main().catch((error) => {
  console.error('致命错误:', error);
  process.exit(1);
});
