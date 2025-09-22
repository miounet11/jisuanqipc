/**
 * Expression Type Definitions
 *
 * 数学表达式的类型定义，包含解析和验证相关的接口
 */

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export enum TokenType {
  NUMBER = 'number',
  OPERATOR = 'operator',
  FUNCTION = 'function',
  VARIABLE = 'variable',
  PARENTHESIS = 'parenthesis',
  CONSTANT = 'constant',
  UNKNOWN = 'unknown',
}

export interface ASTNode {
  type: string;
  value?: unknown;
  children?: ASTNode[];
  position?: number;
}

export enum ExpressionType {
  ARITHMETIC = 'arithmetic',      // 基础四则运算
  SCIENTIFIC = 'scientific',      // 科学计算
  MATRIX = 'matrix',              // 矩阵运算
  GEOMETRY = 'geometry',          // 几何计算
  EQUATION = 'equation',          // 方程求解
  LOGIC = 'logic',                // 逻辑运算
  FUNCTION = 'function',          // 函数定义
}

export interface Expression {
  id: string;
  input: string;
  tokens: Token[];
  ast: ASTNode | null;
  isValid: boolean;
  errorMessage: string | null;
  type: ExpressionType;
  createdAt: Date;
  variables: Map<string, number>;
}

export interface ValidationRule {
  check: (expression: Expression) => boolean;
  errorMessage: string;
}

export interface ParseOptions {
  allowVariables?: boolean;
  strictMode?: boolean;
  maxComplexity?: number;
}

export interface ExpressionState {
  phase: 'created' | 'parsing' | 'valid' | 'invalid' | 'evaluating' | 'completed' | 'error';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}