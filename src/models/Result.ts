/**
 * Result Model
 *
 * 计算结果的模型实现，包含格式化和验证逻辑
 */

import {
  Result,
  ResultValue,
  ResultFormat,
  FormatOptions,
  ValidationConstraints,
  ResultMetrics,
  Matrix,
  Graph,
} from '@/types';
import { Decimal } from 'decimal.js';

// 简化的UUID生成器
const generateUUID = (): string => {
  return 'result-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
};

export class ResultModel implements Result {
  public readonly id: string;
  public readonly expressionId: string;
  public value: ResultValue;
  public displayValue: string;
  public format: ResultFormat;
  public precision: number;
  public unit: string | null;
  public isExact: boolean;
  public computationTime: number;
  public readonly createdAt: Date;

  private static readonly DEFAULT_CONSTRAINTS: ValidationConstraints = {
    minPrecision: 1,
    maxPrecision: 50,
    maxComputationTime: 30000, // 30秒
    allowedFormats: Object.values(ResultFormat),
  };

  constructor(
    expressionId: string,
    value: ResultValue,
    options: Partial<FormatOptions> = {},
    id?: string
  ) {
    this.id = id || generateUUID();
    this.expressionId = expressionId;
    this.value = value;
    this.format = options.notation === 'exponential' ? ResultFormat.SCIENTIFIC : ResultFormat.DECIMAL;
    this.precision = options.precision || 10;
    this.unit = options.unit || null;
    this.isExact = this.determineExactness(value);
    this.computationTime = 0;
    this.createdAt = new Date();
    this.displayValue = this.formatValue(options);

    this.validate();
  }

  /**
   * 验证结果对象
   */
  private validate(): void {
    const constraints = ResultModel.DEFAULT_CONSTRAINTS;

    if (!this.expressionId || this.expressionId.trim().length === 0) {
      throw new Error('结果必须关联有效的表达式ID');
    }

    if (this.precision < constraints.minPrecision || this.precision > constraints.maxPrecision) {
      throw new Error(`精度必须在 ${constraints.minPrecision} 到 ${constraints.maxPrecision} 之间`);
    }

    if (!constraints.allowedFormats.includes(this.format)) {
      throw new Error(`不支持的结果格式: ${this.format}`);
    }

    if (this.computationTime > constraints.maxComputationTime) {
      throw new Error(`计算时间超出限制: ${this.computationTime}ms`);
    }
  }

  /**
   * 判断结果是否为精确值
   */
  private determineExactness(value: ResultValue): boolean {
    if (value === null) return false;

    if (value instanceof Decimal) {
      // 检查是否为整数或简单分数
      return value.isInteger() || this.isSimpleFraction(value);
    }

    if (this.isMatrix(value)) {
      // 矩阵的精确性取决于所有元素
      return value.data.every(row =>
        row.every(element => element.isInteger() || this.isSimpleFraction(element))
      );
    }

    // Graph类型通常不是精确的
    return false;
  }

  /**
   * 检查是否为简单分数
   */
  private isSimpleFraction(value: Decimal): boolean {
    try {
      // 简化的分数检测：小数位数少于4位且分母小于100
      const str = value.toString();
      const decimalPart = str.split('.')[1];
      if (!decimalPart || decimalPart.length > 4) return false;

      const fraction = this.decimalToFraction(value);
      return fraction.denominator <= 100;
    } catch {
      return false;
    }
  }

  /**
   * 将小数转换为分数（简化版）
   */
  private decimalToFraction(decimal: Decimal): { numerator: number; denominator: number } {
    const tolerance = 1e-10;
    let numerator = 1;
    let denominator = 1;
    let value = decimal.toNumber();

    while (Math.abs(value - Math.round(value)) > tolerance && denominator < 100) {
      value *= 10;
      denominator *= 10;
      numerator = Math.round(value);
    }

    // 简化分数
    const gcd = this.greatestCommonDivisor(numerator, denominator);
    return {
      numerator: numerator / gcd,
      denominator: denominator / gcd,
    };
  }

  /**
   * 计算最大公约数
   */
  private greatestCommonDivisor(a: number, b: number): number {
    return b === 0 ? a : this.greatestCommonDivisor(b, a % b);
  }

  /**
   * 格式化显示值
   */
  private formatValue(options: Partial<FormatOptions> = {}): string {
    if (this.value === null) {
      return 'Error';
    }

    if (this.value instanceof Decimal) {
      return this.formatDecimal(this.value, options);
    }

    if (this.isMatrix(this.value)) {
      return this.formatMatrix(this.value);
    }

    if (this.isGraph(this.value)) {
      return `图形 (${this.value.points.length} 个点)`;
    }

    return String(this.value);
  }

  /**
   * 格式化Decimal值
   */
  private formatDecimal(value: Decimal, options: Partial<FormatOptions>): string {
    const locale = options.locale || 'zh-CN';

    switch (this.format) {
      case ResultFormat.SCIENTIFIC:
        return value.toExponential(this.precision);

      case ResultFormat.FRACTION:
        if (this.isSimpleFraction(value)) {
          const fraction = this.decimalToFraction(value);
          return `${fraction.numerator}/${fraction.denominator}`;
        }
        return value.toFixed(this.precision);

      case ResultFormat.PERCENTAGE:
        return (value.toNumber() * 100).toFixed(this.precision) + '%';

      case ResultFormat.BINARY:
        const intValue = Math.floor(value.toNumber());
        return '0b' + intValue.toString(2);

      case ResultFormat.HEXADECIMAL:
        const hexValue = Math.floor(value.toNumber());
        return '0x' + hexValue.toString(16).toUpperCase();

      case ResultFormat.DECIMAL:
      default:
        const formatted = value.toFixed(this.precision);
        // 移除尾随的零
        return parseFloat(formatted).toLocaleString(locale);
    }
  }

  /**
   * 格式化矩阵显示
   */
  private formatMatrix(matrix: Matrix): string {
    const rows = matrix.data.map(row =>
      '[' + row.map(val => val.toFixed(2)).join(', ') + ']'
    );
    return `Matrix ${matrix.rows}×${matrix.cols}:\n` + rows.join('\n');
  }

  /**
   * 类型守卫：检查是否为矩阵
   */
  private isMatrix(value: ResultValue): value is Matrix {
    return value !== null &&
           typeof value === 'object' &&
           'rows' in value &&
           'cols' in value &&
           'data' in value;
  }

  /**
   * 类型守卫：检查是否为图形
   */
  private isGraph(value: ResultValue): value is Graph {
    return value !== null &&
           typeof value === 'object' &&
           'points' in value &&
           'id' in value;
  }

  /**
   * 更新显示格式
   */
  public updateFormat(format: ResultFormat, options: Partial<FormatOptions> = {}): void {
    this.format = format;
    if (options.precision !== undefined) {
      this.precision = options.precision;
    }
    this.displayValue = this.formatValue(options);
    this.validate();
  }

  /**
   * 设置计算时间
   */
  public setComputationTime(time: number): void {
    if (time < 0) {
      throw new Error('计算时间不能为负数');
    }
    this.computationTime = time;
    this.validate();
  }

  /**
   * 获取数值结果（如果适用）
   */
  public getNumericValue(): number | null {
    if (this.value instanceof Decimal) {
      return this.value.toNumber();
    }
    return null;
  }

  /**
   * 获取结果度量
   */
  public getMetrics(): ResultMetrics {
    const numericValue = this.getNumericValue();

    return {
      accuracy: this.isExact ? 1.0 : 0.95, // 简化的精度评估
      stability: numericValue !== null && !isNaN(numericValue) ? 1.0 : 0.0,
      performance: this.computationTime < 1000 ? 1.0 : Math.max(0.1, 1000 / this.computationTime),
    };
  }

  /**
   * 比较两个结果
   */
  public equals(other: Result): boolean {
    if (this.expressionId !== other.expressionId) return false;

    if (this.value instanceof Decimal && other.value instanceof Decimal) {
      return this.value.equals(other.value);
    }

    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }

  /**
   * 克隆结果
   */
  public clone(): ResultModel {
    const cloned = new ResultModel(
      this.expressionId,
      this.value,
      {
        precision: this.precision,
        unit: this.unit,
      },
      this.id
    );

    cloned.format = this.format;
    cloned.isExact = this.isExact;
    cloned.computationTime = this.computationTime;

    return cloned;
  }

  /**
   * 序列化为JSON
   */
  public toJSON(): Result {
    return {
      id: this.id,
      expressionId: this.expressionId,
      value: this.value,
      displayValue: this.displayValue,
      format: this.format,
      precision: this.precision,
      unit: this.unit,
      isExact: this.isExact,
      computationTime: this.computationTime,
      createdAt: this.createdAt,
    };
  }

  /**
   * 从JSON反序列化
   */
  public static fromJSON(data: Result): ResultModel {
    const result = new ResultModel(
      data.expressionId,
      data.value,
      {
        precision: data.precision,
        unit: data.unit,
      },
      data.id
    );

    result.format = data.format;
    result.isExact = data.isExact;
    result.computationTime = data.computationTime;
    result.displayValue = data.displayValue;

    return result;
  }

  /**
   * 创建错误结果
   */
  public static createError(expressionId: string, errorMessage: string): ResultModel {
    const result = new ResultModel(expressionId, null);
    result.displayValue = `错误: ${errorMessage}`;
    result.isExact = false;
    return result;
  }
}