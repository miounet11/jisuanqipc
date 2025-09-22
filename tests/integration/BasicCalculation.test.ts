/**
 * Basic Calculation Integration Test
 *
 * 基础计算流程集成测试
 */

import { CalculatorService } from '@/services/CalculatorService';
import { StorageService } from '@/services/StorageService';
import { Expression } from '@/models/Expression';
import { Result } from '@/models/Result';
import { History } from '@/models/History';

describe('Basic Calculation Integration', () => {
  let calculatorService: CalculatorService;
  let storageService: StorageService;

  beforeAll(async () => {
    // 初始化服务
    calculatorService = new CalculatorService();
    storageService = new StorageService();
    await storageService.initialize();
  });

  beforeEach(async () => {
    // 清理历史记录
    await storageService.clearHistory();
  });

  afterAll(async () => {
    // 清理测试数据
    await storageService.clearAll();
  });

  describe('Basic Arithmetic Operations', () => {
    test('should perform addition correctly', async () => {
      const expression = Expression.create('2 + 3');
      const result = await calculatorService.calculate(expression);

      expect(result.value).toBe('5');
      expect(result.error).toBeNull();
      expect(result.isValid).toBe(true);
    });

    test('should perform subtraction correctly', async () => {
      const expression = Expression.create('10 - 4');
      const result = await calculatorService.calculate(expression);

      expect(result.value).toBe('6');
      expect(result.error).toBeNull();
      expect(result.isValid).toBe(true);
    });

    test('should perform multiplication correctly', async () => {
      const expression = Expression.create('6 * 7');
      const result = await calculatorService.calculate(expression);

      expect(result.value).toBe('42');
      expect(result.error).toBeNull();
      expect(result.isValid).toBe(true);
    });

    test('should perform division correctly', async () => {
      const expression = Expression.create('15 / 3');
      const result = await calculatorService.calculate(expression);

      expect(result.value).toBe('5');
      expect(result.error).toBeNull();
      expect(result.isValid).toBe(true);
    });

    test('should handle division by zero', async () => {
      const expression = Expression.create('10 / 0');
      const result = await calculatorService.calculate(expression);

      expect(result.error).not.toBeNull();
      expect(result.isValid).toBe(false);
      expect(result.error?.message).toMatch(/division by zero|infinity/i);
    });
  });

  describe('Complex Expressions', () => {
    test('should respect operator precedence', async () => {
      const expression = Expression.create('2 + 3 * 4');
      const result = await calculatorService.calculate(expression);

      expect(result.value).toBe('14'); // 2 + (3 * 4) = 14
      expect(result.error).toBeNull();
    });

    test('should handle parentheses correctly', async () => {
      const expression = Expression.create('(2 + 3) * 4');
      const result = await calculatorService.calculate(expression);

      expect(result.value).toBe('20'); // (2 + 3) * 4 = 20
      expect(result.error).toBeNull();
    });

    test('should handle nested parentheses', async () => {
      const expression = Expression.create('((2 + 3) * 4) - 5');
      const result = await calculatorService.calculate(expression);

      expect(result.value).toBe('15'); // ((2 + 3) * 4) - 5 = 15
      expect(result.error).toBeNull();
    });

    test('should handle decimal numbers', async () => {
      const expression = Expression.create('3.14 + 2.86');
      const result = await calculatorService.calculate(expression);

      expect(parseFloat(result.value)).toBeCloseTo(6.0, 2);
      expect(result.error).toBeNull();
    });
  });

  describe('Memory Operations', () => {
    test('should store and recall memory values', async () => {
      // 先计算一个值
      const expression1 = Expression.create('25 * 4');
      const result1 = await calculatorService.calculate(expression1);
      expect(result1.value).toBe('100');

      // 存储到内存
      await calculatorService.memoryStore(result1.value);

      // 使用内存值进行新计算
      const expression2 = Expression.create('MR + 50');
      const result2 = await calculatorService.calculate(expression2);

      expect(result2.value).toBe('150');
      expect(result2.error).toBeNull();
    });

    test('should add to memory correctly', async () => {
      // 初始化内存
      await calculatorService.memoryClear();
      await calculatorService.memoryStore('10');

      // 添加到内存
      await calculatorService.memoryAdd('5');

      // 检查内存值
      const memoryValue = await calculatorService.memoryRecall();
      expect(memoryValue).toBe('15');
    });

    test('should subtract from memory correctly', async () => {
      // 初始化内存
      await calculatorService.memoryClear();
      await calculatorService.memoryStore('20');

      // 从内存减去
      await calculatorService.memorySubtract('8');

      // 检查内存值
      const memoryValue = await calculatorService.memoryRecall();
      expect(memoryValue).toBe('12');
    });
  });

  describe('History Management', () => {
    test('should save calculation history', async () => {
      const expression1 = Expression.create('10 + 5');
      const result1 = await calculatorService.calculate(expression1);

      const expression2 = Expression.create('20 * 2');
      const result2 = await calculatorService.calculate(expression2);

      // 获取历史记录
      const history = await storageService.getHistory();

      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history.some(h => h.expression === '10 + 5' && h.result === '15')).toBe(true);
      expect(history.some(h => h.expression === '20 * 2' && h.result === '40')).toBe(true);
    });

    test('should limit history size', async () => {
      // 设置历史记录限制
      const maxHistorySize = 5;
      await storageService.setMaxHistorySize(maxHistorySize);

      // 执行多个计算
      for (let i = 1; i <= 10; i++) {
        const expression = Expression.create(`${i} + 1`);
        await calculatorService.calculate(expression);
      }

      // 检查历史记录大小
      const history = await storageService.getHistory();
      expect(history.length).toBeLessThanOrEqual(maxHistorySize);
    });

    test('should search history correctly', async () => {
      // 执行一些计算
      await calculatorService.calculate(Expression.create('100 + 50'));
      await calculatorService.calculate(Expression.create('200 - 75'));
      await calculatorService.calculate(Expression.create('300 * 2'));

      // 搜索包含"100"的历史记录
      const searchResults = await storageService.searchHistory('100');

      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.some(h => h.expression.includes('100'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid expressions gracefully', async () => {
      const invalidExpressions = [
        '2 +',
        '* 3',
        '2 + + 3',
        '(2 + 3',
        '2 + 3)',
        '',
        '   ',
      ];

      for (const expr of invalidExpressions) {
        const expression = Expression.create(expr);
        const result = await calculatorService.calculate(expression);

        expect(result.isValid).toBe(false);
        expect(result.error).not.toBeNull();
      }
    });

    test('should handle very large numbers', async () => {
      const expression = Expression.create('999999999999999 * 999999999999999');
      const result = await calculatorService.calculate(expression);

      // 应该要么成功计算，要么产生适当的错误
      if (result.isValid) {
        expect(result.value).toBeTruthy();
      } else {
        expect(result.error).not.toBeNull();
      }
    });

    test('should handle very small numbers', async () => {
      const expression = Expression.create('0.000000000001 + 0.000000000001');
      const result = await calculatorService.calculate(expression);

      expect(result.isValid).toBe(true);
      expect(parseFloat(result.value)).toBeGreaterThan(0);
    });
  });

  describe('Continuous Calculations', () => {
    test('should chain calculations correctly', async () => {
      // 第一次计算
      const result1 = await calculatorService.calculate(Expression.create('10 + 5'));
      expect(result1.value).toBe('15');

      // 使用前一个结果继续计算
      const result2 = await calculatorService.calculate(Expression.create('Ans * 2'));
      expect(result2.value).toBe('30');

      // 再次使用结果
      const result3 = await calculatorService.calculate(Expression.create('Ans - 10'));
      expect(result3.value).toBe('20');
    });

    test('should maintain calculation context', async () => {
      // 执行多个相关计算
      await calculatorService.calculate(Expression.create('5 + 5'));
      await calculatorService.calculate(Expression.create('10 * 2'));
      await calculatorService.calculate(Expression.create('20 / 4'));

      // 验证最后的答案值
      const lastAnswer = await calculatorService.getLastAnswer();
      expect(lastAnswer).toBe('5');
    });
  });

  describe('Performance Tests', () => {
    test('should calculate simple expressions quickly', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        await calculatorService.calculate(Expression.create(`${i} + 1`));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 100个简单计算应该在1秒内完成
      expect(duration).toBeLessThan(1000);
    });

    test('should handle concurrent calculations', async () => {
      const calculations = [];

      for (let i = 0; i < 10; i++) {
        calculations.push(
          calculatorService.calculate(Expression.create(`${i * 2} + ${i * 3}`))
        );
      }

      const results = await Promise.all(calculations);

      // 所有计算都应该成功
      results.forEach((result, index) => {
        expect(result.isValid).toBe(true);
        expect(result.value).toBe((index * 5).toString());
      });
    });
  });
});