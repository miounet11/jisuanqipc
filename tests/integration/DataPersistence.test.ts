/**
 * Data Persistence Integration Test
 *
 * 数据持久化集成测试
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '@/services/StorageService';
import { CalculatorService } from '@/services/CalculatorService';
import { Expression } from '@/models/Expression';
import { Result } from '@/models/Result';
import { History } from '@/models/History';
import { Settings } from '@/models/Settings';

describe('Data Persistence Integration', () => {
  let storageService: StorageService;
  let calculatorService: CalculatorService;

  beforeAll(async () => {
    storageService = new StorageService();
    calculatorService = new CalculatorService();
    await storageService.initialize();
  });

  beforeEach(async () => {
    // 清理所有存储数据
    await AsyncStorage.clear();
    await storageService.initialize();
  });

  afterAll(async () => {
    await AsyncStorage.clear();
  });

  describe('Settings Persistence', () => {
    test('should save and load settings correctly', async () => {
      const testSettings: Settings = {
        id: 'test-settings',
        theme: 'dark',
        scientificMode: true,
        angleUnit: 'radian',
        decimalPlaces: 6,
        thousandsSeparator: false,
        vibrationEnabled: false,
        soundEnabled: true,
        historyEnabled: true,
        maxHistoryItems: 50,
        fontSize: 'large',
        buttonStyle: 'square',
        autoSave: false,
        precision: 'standard',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-12-31'),
      };

      // 保存设置
      await storageService.saveSettings(testSettings);

      // 重新加载设置
      const loadedSettings = await storageService.getSettings();

      expect(loadedSettings).toBeDefined();
      expect(loadedSettings?.theme).toBe('dark');
      expect(loadedSettings?.scientificMode).toBe(true);
      expect(loadedSettings?.angleUnit).toBe('radian');
      expect(loadedSettings?.decimalPlaces).toBe(6);
      expect(loadedSettings?.vibrationEnabled).toBe(false);
      expect(loadedSettings?.soundEnabled).toBe(true);
      expect(loadedSettings?.maxHistoryItems).toBe(50);
    });

    test('should handle settings migration', async () => {
      // 模拟旧版本设置数据
      const oldSettings = {
        theme: 'light',
        scientificMode: false,
        // 缺少一些新字段
      };

      await AsyncStorage.setItem('calculator_settings', JSON.stringify(oldSettings));

      // 初始化存储服务（应该触发迁移）
      const loadedSettings = await storageService.getSettings();

      expect(loadedSettings).toBeDefined();
      expect(loadedSettings?.theme).toBe('light');
      expect(loadedSettings?.scientificMode).toBe(false);
      // 新字段应该有默认值
      expect(loadedSettings?.vibrationEnabled).toBeDefined();
      expect(loadedSettings?.historyEnabled).toBeDefined();
    });

    test('should validate settings before saving', async () => {
      const invalidSettings = {
        theme: 'invalid_theme',
        decimalPlaces: -1,
        maxHistoryItems: 0,
      } as any;

      await expect(storageService.saveSettings(invalidSettings)).rejects.toThrow();
    });
  });

  describe('History Persistence', () => {
    test('should save and load calculation history', async () => {
      const testHistory = [
        {
          id: '1',
          expression: '2 + 3',
          result: '5',
          timestamp: new Date('2023-01-01'),
        },
        {
          id: '2',
          expression: '10 * 7',
          result: '70',
          timestamp: new Date('2023-01-02'),
        },
        {
          id: '3',
          expression: 'sqrt(16)',
          result: '4',
          timestamp: new Date('2023-01-03'),
        },
      ];

      // 保存历史记录
      for (const entry of testHistory) {
        await storageService.addToHistory(entry.expression, entry.result);
      }

      // 加载历史记录
      const loadedHistory = await storageService.getHistory();

      expect(loadedHistory.length).toBeGreaterThanOrEqual(3);

      // 验证最近的记录
      const recentHistory = loadedHistory.slice(-3);
      expect(recentHistory.some(h => h.expression === '2 + 3' && h.result === '5')).toBe(true);
      expect(recentHistory.some(h => h.expression === '10 * 7' && h.result === '70')).toBe(true);
      expect(recentHistory.some(h => h.expression === 'sqrt(16)' && h.result === '4')).toBe(true);
    });

    test('should enforce history size limits', async () => {
      const maxSize = 5;
      await storageService.setMaxHistorySize(maxSize);

      // 添加超过限制的历史记录
      for (let i = 1; i <= 10; i++) {
        await storageService.addToHistory(`${i} + 1`, (i + 1).toString());
      }

      const history = await storageService.getHistory();
      expect(history.length).toBeLessThanOrEqual(maxSize);

      // 应该保留最新的记录
      const latestEntry = history[history.length - 1];
      expect(latestEntry.expression).toBe('10 + 1');
      expect(latestEntry.result).toBe('11');
    });

    test('should search history correctly', async () => {
      // 添加测试数据
      const testData = [
        { expression: 'sin(30)', result: '0.5' },
        { expression: 'cos(60)', result: '0.5' },
        { expression: 'tan(45)', result: '1' },
        { expression: '2 * pi', result: '6.28318' },
        { expression: 'e^2', result: '7.38906' },
      ];

      for (const data of testData) {
        await storageService.addToHistory(data.expression, data.result);
      }

      // 搜索包含"sin"的记录
      const sinResults = await storageService.searchHistory('sin');
      expect(sinResults.length).toBeGreaterThan(0);
      expect(sinResults.some(r => r.expression.includes('sin'))).toBe(true);

      // 搜索包含"pi"的记录
      const piResults = await storageService.searchHistory('pi');
      expect(piResults.length).toBeGreaterThan(0);
      expect(piResults.some(r => r.expression.includes('pi'))).toBe(true);

      // 搜索不存在的内容
      const noResults = await storageService.searchHistory('xyz123');
      expect(noResults.length).toBe(0);
    });

    test('should clear history correctly', async () => {
      // 添加一些历史记录
      await storageService.addToHistory('1 + 1', '2');
      await storageService.addToHistory('2 + 2', '4');

      let history = await storageService.getHistory();
      expect(history.length).toBeGreaterThan(0);

      // 清理历史记录
      await storageService.clearHistory();

      history = await storageService.getHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('Memory Values Persistence', () => {
    test('should persist memory values across sessions', async () => {
      const testValue = '42.5';

      // 存储内存值
      await calculatorService.memoryStore(testValue);

      // 创建新的计算器服务实例（模拟应用重启）
      const newCalculatorService = new CalculatorService();

      // 检索内存值
      const retrievedValue = await newCalculatorService.memoryRecall();
      expect(retrievedValue).toBe(testValue);
    });

    test('should handle memory operations correctly', async () => {
      // 清除内存
      await calculatorService.memoryClear();

      // 存储初始值
      await calculatorService.memoryStore('10');

      // 执行内存加法
      await calculatorService.memoryAdd('5');
      let memoryValue = await calculatorService.memoryRecall();
      expect(memoryValue).toBe('15');

      // 执行内存减法
      await calculatorService.memorySubtract('3');
      memoryValue = await calculatorService.memoryRecall();
      expect(memoryValue).toBe('12');

      // 清除内存
      await calculatorService.memoryClear();
      memoryValue = await calculatorService.memoryRecall();
      expect(memoryValue).toBe('0');
    });
  });

  describe('Last Answer Persistence', () => {
    test('should persist last answer across calculations', async () => {
      // 执行计算
      const expression1 = Expression.create('25 * 4');
      const result1 = await calculatorService.calculate(expression1);
      expect(result1.value).toBe('100');

      // 使用上一个答案
      const expression2 = Expression.create('Ans + 50');
      const result2 = await calculatorService.calculate(expression2);
      expect(result2.value).toBe('150');

      // 验证答案持久化
      const lastAnswer = await calculatorService.getLastAnswer();
      expect(lastAnswer).toBe('150');
    });

    test('should handle answer persistence across service restarts', async () => {
      // 执行计算
      const expression = Expression.create('123.456');
      await calculatorService.calculate(expression);

      // 创建新服务实例
      const newCalculatorService = new CalculatorService();

      // 答案应该仍然可用
      const lastAnswer = await newCalculatorService.getLastAnswer();
      expect(lastAnswer).toBe('123.456');
    });
  });

  describe('Data Migration and Versioning', () => {
    test('should handle data format migrations', async () => {
      // 模拟旧版本数据格式
      const oldFormatHistory = [
        { expr: '1+1', res: '2', date: '2023-01-01' }, // 旧字段名
        { expr: '2*3', res: '6', date: '2023-01-02' },
      ];

      await AsyncStorage.setItem('calculator_history', JSON.stringify(oldFormatHistory));

      // 重新初始化存储服务（应该触发迁移）
      await storageService.initialize();

      const history = await storageService.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);

      // 数据应该已经迁移到新格式
      expect(history.some(h => h.expression === '1+1' && h.result === '2')).toBe(true);
      expect(history.some(h => h.expression === '2*3' && h.result === '6')).toBe(true);
    });

    test('should handle corrupted data gracefully', async () => {
      // 写入损坏的数据
      await AsyncStorage.setItem('calculator_settings', 'invalid json');
      await AsyncStorage.setItem('calculator_history', '{broken json}');

      // 初始化应该成功并使用默认值
      await expect(storageService.initialize()).resolves.not.toThrow();

      const settings = await storageService.getSettings();
      expect(settings).toBeDefined();

      const history = await storageService.getHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Storage Quotas and Limits', () => {
    test('should handle storage quota limits', async () => {
      // 尝试存储大量数据
      const largeHistory = [];
      for (let i = 0; i < 10000; i++) {
        largeHistory.push({
          expression: `${i} + ${i + 1}`,
          result: (2 * i + 1).toString(),
          timestamp: new Date(),
        });
      }

      // 存储应该成功或优雅地处理限制
      for (let i = 0; i < 100; i++) { // 只测试前100个，避免测试时间过长
        await expect(
          storageService.addToHistory(largeHistory[i].expression, largeHistory[i].result)
        ).resolves.not.toThrow();
      }

      const history = await storageService.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    test('should cleanup old data when storage is full', async () => {
      // 设置较小的历史记录限制
      await storageService.setMaxHistorySize(10);

      // 添加大量数据
      for (let i = 1; i <= 20; i++) {
        await storageService.addToHistory(`calculation${i}`, i.toString());
      }

      const history = await storageService.getHistory();
      expect(history.length).toBeLessThanOrEqual(10);

      // 应该保留最新的记录
      const latestEntry = history[history.length - 1];
      expect(latestEntry.expression).toBe('calculation20');
    });
  });

  describe('Backup and Restore', () => {
    test('should export data correctly', async () => {
      // 添加测试数据
      await storageService.addToHistory('2 + 2', '4');
      await storageService.addToHistory('3 * 3', '9');

      const testSettings: Settings = {
        id: 'backup-test',
        theme: 'dark',
        scientificMode: true,
        angleUnit: 'degree',
        decimalPlaces: 4,
        thousandsSeparator: true,
        vibrationEnabled: true,
        soundEnabled: false,
        historyEnabled: true,
        maxHistoryItems: 100,
        fontSize: 'medium',
        buttonStyle: 'rounded',
        autoSave: true,
        precision: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await storageService.saveSettings(testSettings);

      // 导出数据
      const exportedData = await storageService.exportData();

      expect(exportedData).toBeDefined();
      expect(exportedData.settings).toBeDefined();
      expect(exportedData.history).toBeDefined();
      expect(exportedData.version).toBeDefined();
      expect(exportedData.exportDate).toBeDefined();

      expect(exportedData.history.length).toBeGreaterThanOrEqual(2);
      expect(exportedData.settings.theme).toBe('dark');
    });

    test('should import data correctly', async () => {
      const importData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        settings: {
          id: 'import-test',
          theme: 'light',
          scientificMode: false,
          angleUnit: 'radian',
          decimalPlaces: 8,
          thousandsSeparator: false,
          vibrationEnabled: false,
          soundEnabled: true,
          historyEnabled: true,
          maxHistoryItems: 200,
          fontSize: 'small',
          buttonStyle: 'square',
          autoSave: false,
          precision: 'standard',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        history: [
          { expression: '5 + 5', result: '10', timestamp: new Date().toISOString() },
          { expression: '6 * 7', result: '42', timestamp: new Date().toISOString() },
        ],
      };

      // 导入数据
      await storageService.importData(importData);

      // 验证导入结果
      const settings = await storageService.getSettings();
      expect(settings?.theme).toBe('light');
      expect(settings?.decimalPlaces).toBe(8);

      const history = await storageService.getHistory();
      expect(history.some(h => h.expression === '5 + 5')).toBe(true);
      expect(history.some(h => h.expression === '6 * 7')).toBe(true);
    });

    test('should validate import data', async () => {
      const invalidImportData = {
        // 缺少必要字段
        settings: { theme: 'invalid' },
      };

      await expect(storageService.importData(invalidImportData as any)).rejects.toThrow();
    });
  });

  describe('Concurrent Access', () => {
    test('should handle concurrent read/write operations', async () => {
      const operations = [];

      // 同时执行多个读写操作
      for (let i = 0; i < 10; i++) {
        operations.push(storageService.addToHistory(`expr${i}`, i.toString()));
        operations.push(storageService.getHistory());
      }

      // 所有操作都应该成功完成
      await expect(Promise.all(operations)).resolves.toBeDefined();

      const finalHistory = await storageService.getHistory();
      expect(finalHistory.length).toBeGreaterThanOrEqual(10);
    });

    test('should maintain data consistency under concurrent access', async () => {
      // 并发添加历史记录
      const concurrentAdds = [];
      for (let i = 0; i < 20; i++) {
        concurrentAdds.push(
          storageService.addToHistory(`concurrent${i}`, i.toString())
        );
      }

      await Promise.all(concurrentAdds);

      const history = await storageService.getHistory();

      // 所有记录都应该被正确保存
      for (let i = 0; i < 20; i++) {
        expect(history.some(h => h.expression === `concurrent${i}`)).toBe(true);
      }
    });
  });
});