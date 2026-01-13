/**
 * 配置管理
 */
import { Config } from './types.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const DEFAULT_CONFIG: Config = {
  // 源码目录（相对于项目根目录）
  sourceDir: 'Engine/Source',
  
  // 输出目录
  outputDir: 'docs/ue5-api',
  
  // 要处理的模块类别
  moduleCategories: ['Runtime', 'Editor', 'Developer', 'Programs'],
  
  // 排除的目录
  excludeDirs: ['ThirdParty'],
  
  // 引擎版本
  engineVersion: '5.1',
  
  // 文档格式
  formats: ['markdown', 'json'],
  
  // 是否增量更新
  incremental: true,
  
  // 并行处理线程数（Node.js 使用 worker_threads）
  parallelThreads: 4,
};

/**
 * 获取配置，支持命令行参数覆盖
 */
export function getConfig(overrides: Partial<Config> = {}): Config {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
  };
}
