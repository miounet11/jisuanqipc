/**
 * Result Type Definitions
 *
 * 计算结果的类型定义，支持多种数值格式和显示方式
 */

import { Decimal } from 'decimal.js';

export enum ResultFormat {
  DECIMAL = 'decimal',            // 十进制
  SCIENTIFIC = 'scientific',     // 科学计数法
  FRACTION = 'fraction',         // 分数形式
  PERCENTAGE = 'percentage',     // 百分比
  BINARY = 'binary',             // 二进制
  HEXADECIMAL = 'hexadecimal',   // 十六进制
}

export interface Matrix {
  rows: number;
  cols: number;
  data: Decimal[][];
}

export interface Graph {
  id: string;
  points: Point[];
  metadata: GraphMetadata;
}

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface GraphMetadata {
  type: '2d' | '3d';
  domain: Range;
  range: Range;
  resolution: number;
}

export interface Range {
  min: number;
  max: number;
}

export type ResultValue = Decimal | Matrix | Graph | null;

export interface Result {
  id: string;
  expressionId: string;
  value: ResultValue;
  displayValue: string;
  format: ResultFormat;
  precision: number;
  unit: string | null;
  isExact: boolean;
  computationTime: number;
  createdAt: Date;
}

export interface FormatOptions {
  precision?: number;
  notation?: 'fixed' | 'exponential' | 'engineering';
  unit?: string;
  locale?: string;
}

export interface ValidationConstraints {
  minPrecision: number;
  maxPrecision: number;
  maxComputationTime: number;
  allowedFormats: ResultFormat[];
}

export interface ResultMetrics {
  accuracy: number;
  stability: number;
  performance: number;
}