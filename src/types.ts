/**
 * TypeScript 类型定义
 */

export interface ModuleInfo {
  name: string;
  path: string;
  category: string; // Runtime/Editor/Developer/Programs
  buildCsPath: string;
  publicDir?: string;
  privateDir?: string;
}

export interface Dependencies {
  public: string[];
  private: string[];
  dynamic: string[];
}

export interface ClassInfo {
  name: string;
  baseClasses: string[];
  access: string;
  members: Array<{
    name: string;
    type: string;
    access: string;
  }>;
  filePath: string;
}

export interface FunctionInfo {
  name: string;
  returnType: string;
  parameters: Array<{
    name: string;
    type: string;
  }>;
  access: string;
  isStatic: boolean;
  isVirtual: boolean;
  filePath: string;
}

export interface EnumInfo {
  name: string;
  values: Array<{
    name: string;
    value: string;
  }>;
  filePath: string;
}

export interface StructInfo {
  name: string;
  members: Array<{
    name: string;
    type: string;
  }>;
  filePath: string;
}

export interface APIData {
  classes: ClassInfo[];
  functions: FunctionInfo[];
  enums: EnumInfo[];
  structs: StructInfo[];
}

export interface ModuleData {
  name: string;
  path: string;
  category: string;
  dependencies: Dependencies;
  classes: ClassInfo[];
  functions: FunctionInfo[];
  enums: EnumInfo[];
  structs: StructInfo[];
  description?: string;
}

export interface Config {
  sourceDir: string;
  pluginsDir?: string;
  outputDir: string;
  engineVersion: string;
  moduleCategories: string[];
  excludeDirs: string[];
  formats: string[];
  incremental: boolean;
  parallelThreads: number;
}

export interface BestPractice {
  title: string;
  description: string;
  category: string;
}

export interface Example {
  type: 'comment' | 'generated';
  title?: string;
  code: string;
  description?: string;
  file?: string;
}
