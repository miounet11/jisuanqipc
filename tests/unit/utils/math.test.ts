/**
 * Math Utils Unit Tests
 *
 * 数学工具函数单元测试
 */

import { MathUtils } from '@/utils/math';

describe('MathUtils', () => {
  describe('Basic Arithmetic', () => {
    test('should add numbers correctly', () => {
      expect(MathUtils.add(2, 3)).toBe(5);
      expect(MathUtils.add(-2, 3)).toBe(1);
      expect(MathUtils.add(0, 0)).toBe(0);
      expect(MathUtils.add(1.5, 2.5)).toBe(4);
    });

    test('should subtract numbers correctly', () => {
      expect(MathUtils.subtract(5, 3)).toBe(2);
      expect(MathUtils.subtract(3, 5)).toBe(-2);
      expect(MathUtils.subtract(0, 0)).toBe(0);
      expect(MathUtils.subtract(2.5, 1.5)).toBe(1);
    });

    test('should multiply numbers correctly', () => {
      expect(MathUtils.multiply(2, 3)).toBe(6);
      expect(MathUtils.multiply(-2, 3)).toBe(-6);
      expect(MathUtils.multiply(0, 5)).toBe(0);
      expect(MathUtils.multiply(2.5, 4)).toBe(10);
    });

    test('should divide numbers correctly', () => {
      expect(MathUtils.divide(6, 2)).toBe(3);
      expect(MathUtils.divide(7, 2)).toBe(3.5);
      expect(MathUtils.divide(-6, 2)).toBe(-3);
      expect(MathUtils.divide(0, 5)).toBe(0);
    });

    test('should handle division by zero', () => {
      expect(() => MathUtils.divide(5, 0)).toThrow('Division by zero');
    });
  });

  describe('Advanced Operations', () => {
    test('should calculate power correctly', () => {
      expect(MathUtils.power(2, 3)).toBe(8);
      expect(MathUtils.power(5, 0)).toBe(1);
      expect(MathUtils.power(2, -2)).toBe(0.25);
      expect(MathUtils.power(-2, 3)).toBe(-8);
    });

    test('should calculate square root correctly', () => {
      expect(MathUtils.sqrt(4)).toBe(2);
      expect(MathUtils.sqrt(9)).toBe(3);
      expect(MathUtils.sqrt(0)).toBe(0);
      expect(MathUtils.sqrt(2)).toBeCloseTo(1.414213562373095);
    });

    test('should handle negative square roots', () => {
      expect(() => MathUtils.sqrt(-1)).toThrow('Cannot calculate square root of negative number');
    });

    test('should calculate absolute value correctly', () => {
      expect(MathUtils.abs(5)).toBe(5);
      expect(MathUtils.abs(-5)).toBe(5);
      expect(MathUtils.abs(0)).toBe(0);
      expect(MathUtils.abs(-3.14)).toBe(3.14);
    });

    test('should calculate percentage correctly', () => {
      expect(MathUtils.percentage(50, 200)).toBe(25);
      expect(MathUtils.percentage(25, 100)).toBe(25);
      expect(MathUtils.percentage(0, 100)).toBe(0);
      expect(MathUtils.percentage(100, 100)).toBe(100);
    });
  });

  describe('Trigonometric Functions', () => {
    test('should calculate sine correctly', () => {
      expect(MathUtils.sin(0)).toBe(0);
      expect(MathUtils.sin(Math.PI / 2)).toBeCloseTo(1);
      expect(MathUtils.sin(Math.PI)).toBeCloseTo(0, 10);
      expect(MathUtils.sin(3 * Math.PI / 2)).toBeCloseTo(-1);
    });

    test('should calculate cosine correctly', () => {
      expect(MathUtils.cos(0)).toBe(1);
      expect(MathUtils.cos(Math.PI / 2)).toBeCloseTo(0, 10);
      expect(MathUtils.cos(Math.PI)).toBeCloseTo(-1);
      expect(MathUtils.cos(2 * Math.PI)).toBeCloseTo(1);
    });

    test('should calculate tangent correctly', () => {
      expect(MathUtils.tan(0)).toBe(0);
      expect(MathUtils.tan(Math.PI / 4)).toBeCloseTo(1);
      expect(MathUtils.tan(Math.PI)).toBeCloseTo(0, 10);
    });

    test('should convert degrees to radians', () => {
      expect(MathUtils.degToRad(0)).toBe(0);
      expect(MathUtils.degToRad(90)).toBeCloseTo(Math.PI / 2);
      expect(MathUtils.degToRad(180)).toBeCloseTo(Math.PI);
      expect(MathUtils.degToRad(360)).toBeCloseTo(2 * Math.PI);
    });

    test('should convert radians to degrees', () => {
      expect(MathUtils.radToDeg(0)).toBe(0);
      expect(MathUtils.radToDeg(Math.PI / 2)).toBeCloseTo(90);
      expect(MathUtils.radToDeg(Math.PI)).toBeCloseTo(180);
      expect(MathUtils.radToDeg(2 * Math.PI)).toBeCloseTo(360);
    });
  });

  describe('Logarithmic Functions', () => {
    test('should calculate natural logarithm correctly', () => {
      expect(MathUtils.ln(1)).toBe(0);
      expect(MathUtils.ln(Math.E)).toBeCloseTo(1);
      expect(MathUtils.ln(Math.E * Math.E)).toBeCloseTo(2);
    });

    test('should handle invalid logarithm input', () => {
      expect(() => MathUtils.ln(0)).toThrow('Logarithm undefined for zero');
      expect(() => MathUtils.ln(-1)).toThrow('Logarithm undefined for negative numbers');
    });

    test('should calculate base-10 logarithm correctly', () => {
      expect(MathUtils.log10(1)).toBe(0);
      expect(MathUtils.log10(10)).toBe(1);
      expect(MathUtils.log10(100)).toBe(2);
      expect(MathUtils.log10(1000)).toBe(3);
    });

    test('should calculate exponential correctly', () => {
      expect(MathUtils.exp(0)).toBe(1);
      expect(MathUtils.exp(1)).toBeCloseTo(Math.E);
      expect(MathUtils.exp(2)).toBeCloseTo(Math.E * Math.E);
    });
  });

  describe('Factorial and Combinatorics', () => {
    test('should calculate factorial correctly', () => {
      expect(MathUtils.factorial(0)).toBe(1);
      expect(MathUtils.factorial(1)).toBe(1);
      expect(MathUtils.factorial(5)).toBe(120);
      expect(MathUtils.factorial(10)).toBe(3628800);
    });

    test('should handle invalid factorial input', () => {
      expect(() => MathUtils.factorial(-1)).toThrow('Factorial undefined for negative numbers');
      expect(() => MathUtils.factorial(1.5)).toThrow('Factorial undefined for non-integers');
    });

    test('should calculate combinations correctly', () => {
      expect(MathUtils.combination(5, 0)).toBe(1);
      expect(MathUtils.combination(5, 1)).toBe(5);
      expect(MathUtils.combination(5, 2)).toBe(10);
      expect(MathUtils.combination(5, 5)).toBe(1);
    });

    test('should calculate permutations correctly', () => {
      expect(MathUtils.permutation(5, 0)).toBe(1);
      expect(MathUtils.permutation(5, 1)).toBe(5);
      expect(MathUtils.permutation(5, 2)).toBe(20);
      expect(MathUtils.permutation(5, 5)).toBe(120);
    });

    test('should handle invalid combination/permutation input', () => {
      expect(() => MathUtils.combination(3, 5)).toThrow('Invalid combination parameters');
      expect(() => MathUtils.permutation(3, 5)).toThrow('Invalid permutation parameters');
    });
  });

  describe('Number Formatting', () => {
    test('should format numbers with decimal places', () => {
      expect(MathUtils.formatDecimal(3.14159, 2)).toBe('3.14');
      expect(MathUtils.formatDecimal(3.14159, 4)).toBe('3.1416');
      expect(MathUtils.formatDecimal(3, 2)).toBe('3.00');
      expect(MathUtils.formatDecimal(123.456, 0)).toBe('123');
    });

    test('should format numbers with thousands separator', () => {
      expect(MathUtils.formatWithSeparator(1234567.89)).toBe('1,234,567.89');
      expect(MathUtils.formatWithSeparator(1234)).toBe('1,234');
      expect(MathUtils.formatWithSeparator(123)).toBe('123');
      expect(MathUtils.formatWithSeparator(0)).toBe('0');
    });

    test('should format scientific notation', () => {
      expect(MathUtils.toScientificNotation(1234567890)).toBe('1.23456789e+9');
      expect(MathUtils.toScientificNotation(0.000123)).toBe('1.23e-4');
      expect(MathUtils.toScientificNotation(0)).toBe('0e+0');
    });

    test('should determine if number needs scientific notation', () => {
      expect(MathUtils.needsScientificNotation(1234567890123)).toBe(true);
      expect(MathUtils.needsScientificNotation(0.0000001)).toBe(true);
      expect(MathUtils.needsScientificNotation(123.456)).toBe(false);
      expect(MathUtils.needsScientificNotation(0)).toBe(false);
    });
  });

  describe('Number Validation', () => {
    test('should validate if value is number', () => {
      expect(MathUtils.isNumber(123)).toBe(true);
      expect(MathUtils.isNumber(123.456)).toBe(true);
      expect(MathUtils.isNumber('123')).toBe(true);
      expect(MathUtils.isNumber('123.456')).toBe(true);
      expect(MathUtils.isNumber('abc')).toBe(false);
      expect(MathUtils.isNumber('')).toBe(false);
      expect(MathUtils.isNumber(null)).toBe(false);
      expect(MathUtils.isNumber(undefined)).toBe(false);
    });

    test('should validate if value is integer', () => {
      expect(MathUtils.isInteger(123)).toBe(true);
      expect(MathUtils.isInteger('123')).toBe(true);
      expect(MathUtils.isInteger(123.0)).toBe(true);
      expect(MathUtils.isInteger(123.456)).toBe(false);
      expect(MathUtils.isInteger('123.456')).toBe(false);
    });

    test('should validate if value is positive', () => {
      expect(MathUtils.isPositive(123)).toBe(true);
      expect(MathUtils.isPositive(0.001)).toBe(true);
      expect(MathUtils.isPositive(0)).toBe(false);
      expect(MathUtils.isPositive(-123)).toBe(false);
    });

    test('should check if number is finite', () => {
      expect(MathUtils.isFinite(123)).toBe(true);
      expect(MathUtils.isFinite(0)).toBe(true);
      expect(MathUtils.isFinite(Infinity)).toBe(false);
      expect(MathUtils.isFinite(-Infinity)).toBe(false);
      expect(MathUtils.isFinite(NaN)).toBe(false);
    });
  });

  describe('Constants', () => {
    test('should provide mathematical constants', () => {
      expect(MathUtils.PI).toBeCloseTo(Math.PI);
      expect(MathUtils.E).toBeCloseTo(Math.E);
      expect(MathUtils.PHI).toBeCloseTo(1.618033988749); // Golden ratio
      expect(MathUtils.SQRT2).toBeCloseTo(Math.sqrt(2));
    });
  });

  describe('Rounding Functions', () => {
    test('should round numbers correctly', () => {
      expect(MathUtils.round(3.14159, 2)).toBe(3.14);
      expect(MathUtils.round(3.14159, 4)).toBe(3.1416);
      expect(MathUtils.round(123.456, 0)).toBe(123);
      expect(MathUtils.round(-3.14159, 2)).toBe(-3.14);
    });

    test('should floor numbers correctly', () => {
      expect(MathUtils.floor(3.9)).toBe(3);
      expect(MathUtils.floor(-3.1)).toBe(-4);
      expect(MathUtils.floor(5)).toBe(5);
    });

    test('should ceil numbers correctly', () => {
      expect(MathUtils.ceil(3.1)).toBe(4);
      expect(MathUtils.ceil(-3.9)).toBe(-3);
      expect(MathUtils.ceil(5)).toBe(5);
    });
  });

  describe('Range and Statistics', () => {
    test('should find minimum value', () => {
      expect(MathUtils.min([1, 2, 3, 4, 5])).toBe(1);
      expect(MathUtils.min([-1, -2, -3])).toBe(-3);
      expect(MathUtils.min([5])).toBe(5);
    });

    test('should find maximum value', () => {
      expect(MathUtils.max([1, 2, 3, 4, 5])).toBe(5);
      expect(MathUtils.max([-1, -2, -3])).toBe(-1);
      expect(MathUtils.max([5])).toBe(5);
    });

    test('should calculate average', () => {
      expect(MathUtils.average([1, 2, 3, 4, 5])).toBe(3);
      expect(MathUtils.average([10, 20])).toBe(15);
      expect(MathUtils.average([5])).toBe(5);
    });

    test('should handle empty arrays', () => {
      expect(() => MathUtils.min([])).toThrow('Empty array');
      expect(() => MathUtils.max([])).toThrow('Empty array');
      expect(() => MathUtils.average([])).toThrow('Empty array');
    });
  });

  describe('Random Numbers', () => {
    test('should generate random numbers in range', () => {
      for (let i = 0; i < 100; i++) {
        const random = MathUtils.randomInRange(1, 10);
        expect(random).toBeGreaterThanOrEqual(1);
        expect(random).toBeLessThan(10);
      }
    });

    test('should generate random integers in range', () => {
      for (let i = 0; i < 100; i++) {
        const random = MathUtils.randomIntInRange(1, 10);
        expect(random).toBeGreaterThanOrEqual(1);
        expect(random).toBeLessThanOrEqual(10);
        expect(Number.isInteger(random)).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle overflow gracefully', () => {
      const largeNumber = Number.MAX_VALUE;
      expect(MathUtils.multiply(largeNumber, 2)).toBe(Infinity);
    });

    test('should handle underflow gracefully', () => {
      const smallNumber = Number.MIN_VALUE;
      expect(MathUtils.divide(smallNumber, 2)).toBe(0);
    });

    test('should handle NaN inputs', () => {
      expect(MathUtils.isNumber(NaN)).toBe(false);
      expect(MathUtils.add(NaN, 5)).toBeNaN();
    });
  });

  describe('Performance', () => {
    test('should perform calculations quickly', () => {
      const startTime = Date.now();

      for (let i = 0; i < 10000; i++) {
        MathUtils.add(i, i + 1);
        MathUtils.multiply(i, 2);
        MathUtils.sin(i / 1000);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 10000 operations should complete in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});