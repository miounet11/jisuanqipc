/**
 * Math Utilities
 *
 * 数学计算相关的工具函数
 */

import { Decimal } from 'decimal.js';
import { AngleUnit } from '@/types';

export class MathUtils {
  // 数学常数
  public static readonly CONSTANTS = {
    PI: Math.PI,
    E: Math.E,
    PHI: (1 + Math.sqrt(5)) / 2, // 黄金比例
    SQRT2: Math.sqrt(2),
    SQRT3: Math.sqrt(3),
    LN2: Math.log(2),
    LN10: Math.log(10),
    LOG2E: Math.log2(Math.E),
    LOG10E: Math.log10(Math.E),
  };

  // 精度配置
  private static precision: number = 15;

  /**
   * 设置计算精度
   */
  public static setPrecision(precision: number): void {
    if (precision < 1 || precision > 50) {
      throw new Error('精度必须在1到50之间');
    }
    MathUtils.precision = precision;
    Decimal.config({ precision: precision + 5 });
  }

  /**
   * 获取当前精度
   */
  public static getPrecision(): number {
    return MathUtils.precision;
  }

  /**
   * 角度转换
   */
  public static convertAngle(
    value: number,
    from: AngleUnit,
    to: AngleUnit
  ): number {
    if (from === to) return value;

    // 先转换为弧度
    let radians: number;
    switch (from) {
      case AngleUnit.DEGREE:
        radians = (value * Math.PI) / 180;
        break;
      case AngleUnit.GRADIAN:
        radians = (value * Math.PI) / 200;
        break;
      case AngleUnit.RADIAN:
      default:
        radians = value;
        break;
    }

    // 从弧度转换为目标单位
    switch (to) {
      case AngleUnit.DEGREE:
        return (radians * 180) / Math.PI;
      case AngleUnit.GRADIAN:
        return (radians * 200) / Math.PI;
      case AngleUnit.RADIAN:
      default:
        return radians;
    }
  }

  /**
   * 安全的数学运算（处理特殊值）
   */
  public static safeOperation(
    operation: () => number,
    defaultValue: number = NaN
  ): number {
    try {
      const result = operation();
      return isFinite(result) ? result : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * 判断数字是否接近零
   */
  public static isNearZero(value: number, tolerance: number = 1e-10): boolean {
    return Math.abs(value) < tolerance;
  }

  /**
   * 判断两个数字是否近似相等
   */
  public static isNearEqual(
    a: number,
    b: number,
    tolerance: number = 1e-10
  ): boolean {
    return Math.abs(a - b) < tolerance;
  }

  /**
   * 限制数值在指定范围内
   */
  public static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * 线性插值
   */
  public static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * 数值映射
   */
  public static map(
    value: number,
    fromMin: number,
    fromMax: number,
    toMin: number,
    toMax: number
  ): number {
    const t = (value - fromMin) / (fromMax - fromMin);
    return MathUtils.lerp(toMin, toMax, t);
  }

  /**
   * 四舍五入到指定小数位数
   */
  public static roundTo(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * 计算最大公约数
   */
  public static gcd(a: number, b: number): number {
    a = Math.abs(Math.floor(a));
    b = Math.abs(Math.floor(b));

    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }

    return a;
  }

  /**
   * 计算最小公倍数
   */
  public static lcm(a: number, b: number): number {
    return Math.abs(a * b) / MathUtils.gcd(a, b);
  }

  /**
   * 判断是否为质数
   */
  public static isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;

    const sqrt = Math.sqrt(n);
    for (let i = 3; i <= sqrt; i += 2) {
      if (n % i === 0) return false;
    }

    return true;
  }

  /**
   * 计算阶乘
   */
  public static factorial(n: number): Decimal {
    if (n < 0 || !Number.isInteger(n)) {
      throw new Error('阶乘只能计算非负整数');
    }

    if (n === 0 || n === 1) return new Decimal(1);

    let result = new Decimal(1);
    for (let i = 2; i <= n; i++) {
      result = result.times(i);
    }

    return result;
  }

  /**
   * 计算组合数 C(n, k)
   */
  public static combination(n: number, k: number): Decimal {
    if (k < 0 || k > n || !Number.isInteger(n) || !Number.isInteger(k)) {
      throw new Error('无效的组合数参数');
    }

    if (k === 0 || k === n) return new Decimal(1);

    // 优化：使用对称性
    if (k > n - k) k = n - k;

    let result = new Decimal(1);
    for (let i = 1; i <= k; i++) {
      result = result.times(n - i + 1).dividedBy(i);
    }

    return result;
  }

  /**
   * 计算排列数 P(n, k)
   */
  public static permutation(n: number, k: number): Decimal {
    if (k < 0 || k > n || !Number.isInteger(n) || !Number.isInteger(k)) {
      throw new Error('无效的排列数参数');
    }

    if (k === 0) return new Decimal(1);

    let result = new Decimal(1);
    for (let i = n; i > n - k; i--) {
      result = result.times(i);
    }

    return result;
  }

  /**
   * 计算二项式系数
   */
  public static binomialCoefficient(n: number, k: number): Decimal {
    return MathUtils.combination(n, k);
  }

  /**
   * 计算数字的数字根
   */
  public static digitalRoot(n: number): number {
    if (n === 0) return 0;
    return 1 + ((Math.abs(n) - 1) % 9);
  }

  /**
   * 判断是否为完全平方数
   */
  public static isPerfectSquare(n: number): boolean {
    if (n < 0) return false;
    const sqrt = Math.sqrt(n);
    return sqrt === Math.floor(sqrt);
  }

  /**
   * 计算平方根（支持负数的复数结果）
   */
  public static sqrt(n: number): { real: number; imaginary: number } {
    if (n >= 0) {
      return { real: Math.sqrt(n), imaginary: 0 };
    } else {
      return { real: 0, imaginary: Math.sqrt(-n) };
    }
  }

  /**
   * 计算 n 次方根
   */
  public static nthRoot(x: number, n: number): number {
    if (n === 0) throw new Error('根次不能为0');
    if (n === 1) return x;
    if (n === 2) return Math.sqrt(x);

    // 处理负数的奇数次方根
    if (x < 0 && n % 2 === 1) {
      return -Math.pow(-x, 1 / n);
    }

    // 负数的偶数次方根在实数范围内无解
    if (x < 0 && n % 2 === 0) {
      throw new Error('负数的偶数次方根在实数范围内无解');
    }

    return Math.pow(x, 1 / n);
  }

  /**
   * 计算对数（支持任意底数）
   */
  public static logBase(x: number, base: number): number {
    if (x <= 0 || base <= 0 || base === 1) {
      throw new Error('对数参数无效');
    }

    return Math.log(x) / Math.log(base);
  }

  /**
   * 斐波那契数列第n项
   */
  public static fibonacci(n: number): Decimal {
    if (n < 0 || !Number.isInteger(n)) {
      throw new Error('斐波那契数列索引必须是非负整数');
    }

    if (n === 0) return new Decimal(0);
    if (n === 1) return new Decimal(1);

    let a = new Decimal(0);
    let b = new Decimal(1);

    for (let i = 2; i <= n; i++) {
      const temp = a.plus(b);
      a = b;
      b = temp;
    }

    return b;
  }

  /**
   * 统计函数
   */
  public static statistics = {
    /**
     * 计算平均值
     */
    mean(values: number[]): number {
      if (values.length === 0) throw new Error('数组不能为空');
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    },

    /**
     * 计算中位数
     */
    median(values: number[]): number {
      if (values.length === 0) throw new Error('数组不能为空');

      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);

      return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    },

    /**
     * 计算众数
     */
    mode(values: number[]): number[] {
      if (values.length === 0) throw new Error('数组不能为空');

      const frequency = new Map<number, number>();

      for (const value of values) {
        frequency.set(value, (frequency.get(value) || 0) + 1);
      }

      const maxFreq = Math.max(...frequency.values());
      return Array.from(frequency.entries())
        .filter(([, freq]) => freq === maxFreq)
        .map(([value]) => value);
    },

    /**
     * 计算标准差
     */
    standardDeviation(values: number[]): number {
      if (values.length === 0) throw new Error('数组不能为空');

      const mean = MathUtils.statistics.mean(values);
      const variance = values.reduce((sum, val) => {
        return sum + Math.pow(val - mean, 2);
      }, 0) / values.length;

      return Math.sqrt(variance);
    },

    /**
     * 计算方差
     */
    variance(values: number[]): number {
      if (values.length === 0) throw new Error('数组不能为空');

      const mean = MathUtils.statistics.mean(values);
      return values.reduce((sum, val) => {
        return sum + Math.pow(val - mean, 2);
      }, 0) / values.length;
    },

    /**
     * 计算范围
     */
    range(values: number[]): number {
      if (values.length === 0) throw new Error('数组不能为空');
      return Math.max(...values) - Math.min(...values);
    },

    /**
     * 计算四分位数
     */
    quartiles(values: number[]): { q1: number; q2: number; q3: number } {
      if (values.length === 0) throw new Error('数组不能为空');

      const sorted = [...values].sort((a, b) => a - b);
      const n = sorted.length;

      const q1Index = Math.floor(n / 4);
      const q2Index = Math.floor(n / 2);
      const q3Index = Math.floor((3 * n) / 4);

      return {
        q1: sorted[q1Index],
        q2: sorted[q2Index], // 中位数
        q3: sorted[q3Index],
      };
    },
  };

  /**
   * 矩阵运算
   */
  public static matrix = {
    /**
     * 矩阵相加
     */
    add(a: number[][], b: number[][]): number[][] {
      if (a.length !== b.length || a[0].length !== b[0].length) {
        throw new Error('矩阵维度不匹配');
      }

      return a.map((row, i) =>
        row.map((val, j) => val + b[i][j])
      );
    },

    /**
     * 矩阵相减
     */
    subtract(a: number[][], b: number[][]): number[][] {
      if (a.length !== b.length || a[0].length !== b[0].length) {
        throw new Error('矩阵维度不匹配');
      }

      return a.map((row, i) =>
        row.map((val, j) => val - b[i][j])
      );
    },

    /**
     * 矩阵相乘
     */
    multiply(a: number[][], b: number[][]): number[][] {
      if (a[0].length !== b.length) {
        throw new Error('矩阵维度不匹配，无法相乘');
      }

      const result: number[][] = [];

      for (let i = 0; i < a.length; i++) {
        result[i] = [];
        for (let j = 0; j < b[0].length; j++) {
          let sum = 0;
          for (let k = 0; k < a[0].length; k++) {
            sum += a[i][k] * b[k][j];
          }
          result[i][j] = sum;
        }
      }

      return result;
    },

    /**
     * 矩阵转置
     */
    transpose(matrix: number[][]): number[][] {
      return matrix[0].map((_, colIndex) =>
        matrix.map(row => row[colIndex])
      );
    },

    /**
     * 计算行列式（仅支持2x2和3x3）
     */
    determinant(matrix: number[][]): number {
      const n = matrix.length;

      if (n !== matrix[0].length) {
        throw new Error('只能计算方阵的行列式');
      }

      if (n === 2) {
        return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
      }

      if (n === 3) {
        return (
          matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
          matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
          matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
        );
      }

      throw new Error('目前只支持2x2和3x3矩阵的行列式计算');
    },

    /**
     * 创建单位矩阵
     */
    identity(size: number): number[][] {
      const matrix: number[][] = [];

      for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
          matrix[i][j] = i === j ? 1 : 0;
        }
      }

      return matrix;
    },
  };

  /**
   * 复数运算
   */
  public static complex = {
    /**
     * 复数加法
     */
    add(
      a: { real: number; imaginary: number },
      b: { real: number; imaginary: number }
    ): { real: number; imaginary: number } {
      return {
        real: a.real + b.real,
        imaginary: a.imaginary + b.imaginary,
      };
    },

    /**
     * 复数减法
     */
    subtract(
      a: { real: number; imaginary: number },
      b: { real: number; imaginary: number }
    ): { real: number; imaginary: number } {
      return {
        real: a.real - b.real,
        imaginary: a.imaginary - b.imaginary,
      };
    },

    /**
     * 复数乘法
     */
    multiply(
      a: { real: number; imaginary: number },
      b: { real: number; imaginary: number }
    ): { real: number; imaginary: number } {
      return {
        real: a.real * b.real - a.imaginary * b.imaginary,
        imaginary: a.real * b.imaginary + a.imaginary * b.real,
      };
    },

    /**
     * 复数模长
     */
    magnitude(z: { real: number; imaginary: number }): number {
      return Math.sqrt(z.real * z.real + z.imaginary * z.imaginary);
    },

    /**
     * 复数幅角
     */
    argument(z: { real: number; imaginary: number }): number {
      return Math.atan2(z.imaginary, z.real);
    },
  };

  /**
   * 数值格式化
   */
  public static format = {
    /**
     * 科学计数法格式化
     */
    scientific(value: number, precision: number = 3): string {
      return value.toExponential(precision);
    },

    /**
     * 工程记数法格式化
     */
    engineering(value: number, precision: number = 3): string {
      if (value === 0) return '0';

      const exponent = Math.floor(Math.log10(Math.abs(value)));
      const engExponent = Math.floor(exponent / 3) * 3;
      const mantissa = value / Math.pow(10, engExponent);

      return `${mantissa.toFixed(precision)}e${engExponent >= 0 ? '+' : ''}${engExponent}`;
    },

    /**
     * 分数格式化
     */
    fraction(value: number, tolerance: number = 1e-6): string {
      if (Number.isInteger(value)) {
        return value.toString();
      }

      let numerator = 1;
      let denominator = 1;
      let x = Math.abs(value);

      while (Math.abs(x - Math.round(x)) > tolerance && denominator < 10000) {
        x *= 10;
        denominator *= 10;
        numerator = Math.round(x);
      }

      // 简化分数
      const gcd = MathUtils.gcd(numerator, denominator);
      numerator /= gcd;
      denominator /= gcd;

      const sign = value < 0 ? '-' : '';
      return denominator === 1 ? `${sign}${numerator}` : `${sign}${numerator}/${denominator}`;
    },
  };
}