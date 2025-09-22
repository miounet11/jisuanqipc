/**
 * CalculatorService Contract Tests
 *
 * 测试计算服务的接口契约，确保API符合预期行为
 * 注意：这些测试应该在实现前失败，遵循TDD原则
 */

import { CalculatorService, ExpressionParseError, CalculationError } from '@/services/CalculatorService';
import { Expression, Result, CalculatorType, ExpressionType } from '@/types';
import { Decimal } from 'decimal.js';

describe('CalculatorService Contract Tests', () => {
  let calculatorService: CalculatorService;

  beforeEach(() => {
    // 注意：这将失败，因为CalculatorService还未实现
    calculatorService = new CalculatorService();
  });

  describe('parseExpression', () => {
    it('should parse valid arithmetic expression', async () => {
      const result = await calculatorService.parseExpression('2 + 3 * 4', CalculatorType.BASIC);

      expect(result).toBeDefined();
      expect(result.input).toBe('2 + 3 * 4');
      expect(result.type).toBe(ExpressionType.ARITHMETIC);
      expect(result.isValid).toBe(true);
      expect(result.tokens).toHaveLength(5); // 2, +, 3, *, 4
    });

    it('should parse scientific expression with functions', async () => {
      const result = await calculatorService.parseExpression('sin(30)', CalculatorType.SCIENTIFIC);

      expect(result).toBeDefined();
      expect(result.input).toBe('sin(30)');
      expect(result.type).toBe(ExpressionType.SCIENTIFIC);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid expression syntax', async () => {
      await expect(
        calculatorService.parseExpression('2 + + 3', CalculatorType.BASIC)
      ).rejects.toThrow(ExpressionParseError);
    });

    it('should handle empty input', async () => {
      await expect(
        calculatorService.parseExpression('', CalculatorType.BASIC)
      ).rejects.toThrow(ExpressionParseError);
    });
  });

  describe('evaluate', () => {
    it('should evaluate basic arithmetic expression', async () => {
      const expression: Expression = {
        id: '1',
        input: '2 + 3 * 4',
        tokens: [],
        ast: null,
        isValid: true,
        errorMessage: null,
        type: ExpressionType.ARITHMETIC,
        createdAt: new Date(),
        variables: new Map(),
      };

      const result = await calculatorService.evaluate(expression);

      expect(result).toBeDefined();
      expect(result.value).toEqual(new Decimal(14));
      expect(result.displayValue).toBe('14');
      expect(result.expressionId).toBe('1');
    });

    it('should evaluate expression with variables', async () => {
      const expression: Expression = {
        id: '2',
        input: 'x + y',
        tokens: [],
        ast: null,
        isValid: true,
        errorMessage: null,
        type: ExpressionType.ARITHMETIC,
        createdAt: new Date(),
        variables: new Map([['x', 5], ['y', 3]]),
      };

      const result = await calculatorService.evaluate(expression);

      expect(result.value).toEqual(new Decimal(8));
    });

    it('should throw error for invalid expression', async () => {
      const expression: Expression = {
        id: '3',
        input: '2 + + 3',
        tokens: [],
        ast: null,
        isValid: false,
        errorMessage: 'Invalid syntax',
        type: ExpressionType.ARITHMETIC,
        createdAt: new Date(),
        variables: new Map(),
      };

      await expect(
        calculatorService.evaluate(expression)
      ).rejects.toThrow(CalculationError);
    });
  });

  describe('simplify', () => {
    it('should simplify algebraic expression', async () => {
      const expression: Expression = {
        id: '4',
        input: 'x + x + 2*x',
        tokens: [],
        ast: null,
        isValid: true,
        errorMessage: null,
        type: ExpressionType.ARITHMETIC,
        createdAt: new Date(),
        variables: new Map(),
      };

      const result = await calculatorService.simplify(expression);

      expect(result.input).toBe('4*x');
    });
  });

  describe('solve', () => {
    it('should solve linear equation', async () => {
      const equation: Expression = {
        id: '5',
        input: '2*x + 3 = 7',
        tokens: [],
        ast: null,
        isValid: true,
        errorMessage: null,
        type: ExpressionType.EQUATION,
        createdAt: new Date(),
        variables: new Map(),
      };

      const solutions = await calculatorService.solve(equation, 'x');

      expect(solutions).toHaveLength(1);
      expect(solutions[0]).toEqual(new Decimal(2));
    });
  });

  describe('derivative', () => {
    it('should compute derivative of polynomial', async () => {
      const expression: Expression = {
        id: '6',
        input: 'x^2 + 3*x + 1',
        tokens: [],
        ast: null,
        isValid: true,
        errorMessage: null,
        type: ExpressionType.FUNCTION,
        createdAt: new Date(),
        variables: new Map(),
      };

      const derivative = await calculatorService.derivative(expression, 'x');

      expect(derivative.input).toBe('2*x + 3');
    });
  });

  describe('integrate', () => {
    it('should compute definite integral', async () => {
      const expression: Expression = {
        id: '7',
        input: 'x^2',
        tokens: [],
        ast: null,
        isValid: true,
        errorMessage: null,
        type: ExpressionType.FUNCTION,
        createdAt: new Date(),
        variables: new Map(),
      };

      const result = await calculatorService.integrate(expression, 'x', 0, 2);

      expect(result).toEqual(new Decimal(8/3));
    });
  });

  describe('matrixOperation', () => {
    it('should perform matrix addition', async () => {
      const matrix1 = {
        rows: 2,
        cols: 2,
        data: [[new Decimal(1), new Decimal(2)], [new Decimal(3), new Decimal(4)]]
      };

      const matrix2 = {
        rows: 2,
        cols: 2,
        data: [[new Decimal(5), new Decimal(6)], [new Decimal(7), new Decimal(8)]]
      };

      const result = await calculatorService.matrixOperation('add', matrix1, matrix2);

      expect(result.data[0][0]).toEqual(new Decimal(6));
      expect(result.data[1][1]).toEqual(new Decimal(12));
    });
  });

  describe('validate', () => {
    it('should validate correct expression syntax', async () => {
      const result = await calculatorService.validate('2 + 3', CalculatorType.BASIC);

      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should detect syntax errors', async () => {
      const result = await calculatorService.validate('2 + + 3', CalculatorType.BASIC);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBeDefined();
      expect(result.errorPosition).toBeDefined();
    });
  });
});