/**
 * Scientific Calculation Integration Test
 *
 * 科学函数集成测试
 */

import { CalculatorService } from '@/services/CalculatorService';
import { StorageService } from '@/services/StorageService';
import { Expression } from '@/models/Expression';
import { MathUtils } from '@/utils/math';

describe('Scientific Calculation Integration', () => {
  let calculatorService: CalculatorService;
  let storageService: StorageService;

  beforeAll(async () => {
    calculatorService = new CalculatorService();
    storageService = new StorageService();
    await storageService.initialize();
  });

  beforeEach(async () => {
    await storageService.clearHistory();
    // 设置为弧度模式进行测试
    await calculatorService.setAngleMode('radian');
  });

  afterAll(async () => {
    await storageService.clearAll();
  });

  describe('Trigonometric Functions', () => {
    test('should calculate sine correctly', async () => {
      const expression = Expression.create('sin(0)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(0, 6);
      expect(result.error).toBeNull();
    });

    test('should calculate sine of π/2', async () => {
      const expression = Expression.create(`sin(${Math.PI / 2})`);
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(1, 6);
    });

    test('should calculate cosine correctly', async () => {
      const expression = Expression.create('cos(0)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(1, 6);
    });

    test('should calculate cosine of π', async () => {
      const expression = Expression.create(`cos(${Math.PI})`);
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(-1, 6);
    });

    test('should calculate tangent correctly', async () => {
      const expression = Expression.create('tan(0)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(0, 6);
    });

    test('should calculate tangent of π/4', async () => {
      const expression = Expression.create(`tan(${Math.PI / 4})`);
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(1, 6);
    });
  });

  describe('Inverse Trigonometric Functions', () => {
    test('should calculate arcsine correctly', async () => {
      const expression = Expression.create('asin(0)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(0, 6);
    });

    test('should calculate arcsine of 1', async () => {
      const expression = Expression.create('asin(1)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(Math.PI / 2, 6);
    });

    test('should calculate arccosine correctly', async () => {
      const expression = Expression.create('acos(1)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(0, 6);
    });

    test('should calculate arctangent correctly', async () => {
      const expression = Expression.create('atan(0)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(0, 6);
    });

    test('should calculate arctangent of 1', async () => {
      const expression = Expression.create('atan(1)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(Math.PI / 4, 6);
    });
  });

  describe('Hyperbolic Functions', () => {
    test('should calculate hyperbolic sine', async () => {
      const expression = Expression.create('sinh(0)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(0, 6);
    });

    test('should calculate hyperbolic cosine', async () => {
      const expression = Expression.create('cosh(0)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(1, 6);
    });

    test('should calculate hyperbolic tangent', async () => {
      const expression = Expression.create('tanh(0)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(0, 6);
    });
  });

  describe('Logarithmic Functions', () => {
    test('should calculate natural logarithm', async () => {
      const expression = Expression.create('ln(1)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(0, 6);
    });

    test('should calculate natural log of e', async () => {
      const expression = Expression.create(`ln(${Math.E})`);
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(1, 6);
    });

    test('should calculate common logarithm', async () => {
      const expression = Expression.create('log(1)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(0, 6);
    });

    test('should calculate log base 10 of 100', async () => {
      const expression = Expression.create('log(100)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(2, 6);
    });

    test('should handle logarithm of negative numbers', async () => {
      const expression = Expression.create('ln(-1)');
      const result = await calculatorService.calculate(expression);

      expect(result.isValid).toBe(false);
      expect(result.error).not.toBeNull();
    });
  });

  describe('Exponential Functions', () => {
    test('should calculate e^x', async () => {
      const expression = Expression.create('exp(0)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(1, 6);
    });

    test('should calculate e^1', async () => {
      const expression = Expression.create('exp(1)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(Math.E, 6);
    });

    test('should calculate powers', async () => {
      const expression = Expression.create('pow(2, 3)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(8, 6);
    });

    test('should calculate square root', async () => {
      const expression = Expression.create('sqrt(16)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(4, 6);
    });

    test('should calculate cube root', async () => {
      const expression = Expression.create('cbrt(27)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(3, 6);
    });
  });

  describe('Constants', () => {
    test('should use π constant correctly', async () => {
      const expression = Expression.create('pi');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(Math.PI, 6);
    });

    test('should use e constant correctly', async () => {
      const expression = Expression.create('e');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(Math.E, 6);
    });

    test('should perform calculations with constants', async () => {
      const expression = Expression.create('2 * pi');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(2 * Math.PI, 6);
    });
  });

  describe('Factorial and Combinatorics', () => {
    test('should calculate factorial', async () => {
      const expression = Expression.create('factorial(5)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBe(120);
    });

    test('should calculate factorial of 0', async () => {
      const expression = Expression.create('factorial(0)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBe(1);
    });

    test('should handle large factorials', async () => {
      const expression = Expression.create('factorial(10)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBe(3628800);
    });

    test('should calculate combinations', async () => {
      const expression = Expression.create('combination(5, 2)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBe(10); // C(5,2) = 10
    });

    test('should calculate permutations', async () => {
      const expression = Expression.create('permutation(5, 2)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBe(20); // P(5,2) = 20
    });
  });

  describe('Angle Mode Conversion', () => {
    test('should convert between degrees and radians', async () => {
      // 设置为度数模式
      await calculatorService.setAngleMode('degree');

      const expression = Expression.create('sin(90)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(1, 6);
    });

    test('should handle angle mode for inverse functions', async () => {
      await calculatorService.setAngleMode('degree');

      const expression = Expression.create('asin(1)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(90, 6);
    });
  });

  describe('Complex Scientific Expressions', () => {
    test('should handle complex trigonometric expressions', async () => {
      const expression = Expression.create('sin(pi/2) + cos(0)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(2, 6);
    });

    test('should handle nested functions', async () => {
      const expression = Expression.create('sqrt(sin(pi/2)^2 + cos(0)^2)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(Math.sqrt(2), 6);
    });

    test('should handle logarithmic and exponential combinations', async () => {
      const expression = Expression.create('ln(exp(2))');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(2, 6);
    });

    test('should handle scientific notation input', async () => {
      const expression = Expression.create('1.5e3 + 2.5e2');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(1750, 6);
    });
  });

  describe('Error Handling for Scientific Functions', () => {
    test('should handle domain errors for square root', async () => {
      const expression = Expression.create('sqrt(-1)');
      const result = await calculatorService.calculate(expression);

      expect(result.isValid).toBe(false);
      expect(result.error).not.toBeNull();
    });

    test('should handle domain errors for arcsine', async () => {
      const expression = Expression.create('asin(2)');
      const result = await calculatorService.calculate(expression);

      expect(result.isValid).toBe(false);
      expect(result.error).not.toBeNull();
    });

    test('should handle overflow in exponentials', async () => {
      const expression = Expression.create('exp(1000)');
      const result = await calculatorService.calculate(expression);

      // 应该要么成功返回Infinity，要么产生溢出错误
      if (result.isValid) {
        expect(result.value).toBe('Infinity');
      } else {
        expect(result.error).not.toBeNull();
      }
    });
  });

  describe('Precision and Rounding', () => {
    test('should maintain precision for small numbers', async () => {
      const expression = Expression.create('sin(1e-10)');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(1e-10, 12);
    });

    test('should handle very precise calculations', async () => {
      const expression = Expression.create('pi - 3.14159265358979323846');
      const result = await calculatorService.calculate(expression);

      expect(Math.abs(parseFloat(result.value))).toBeLessThan(1e-10);
    });
  });

  describe('Performance Tests for Scientific Functions', () => {
    test('should calculate scientific functions quickly', async () => {
      const startTime = Date.now();

      const functions = ['sin', 'cos', 'tan', 'ln', 'exp', 'sqrt'];

      for (let i = 0; i < 50; i++) {
        for (const func of functions) {
          const value = (i + 1) / 10;
          await calculatorService.calculate(Expression.create(`${func}(${value})`));
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 300个科学函数计算应该在2秒内完成
      expect(duration).toBeLessThan(2000);
    });
  });
});