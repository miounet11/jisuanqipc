/**
 * StorageService Contract Tests
 *
 * 测试存储服务的接口契约，确保数据持久化功能正常
 * 注意：这些测试应该在实现前失败，遵循TDD原则
 */

import { StorageService, StorageError, DataCorruptionError } from '@/services/StorageService';
import { Expression, Result, History, Settings, Graph, CalculatorType, ExpressionType } from '@/types';
import { Decimal } from 'decimal.js';

describe('StorageService Contract Tests', () => {
  let storageService: StorageService;

  beforeEach(() => {
    // 注意：这将失败，因为StorageService还未实现
    storageService = new StorageService();
  });

  afterEach(async () => {
    // 清理测试数据
    await storageService.clearHistory();
  });

  describe('Expression Management', () => {
    const mockExpression: Expression = {
      id: 'expr-1',
      input: '2 + 3',
      tokens: [],
      ast: null,
      isValid: true,
      errorMessage: null,
      type: ExpressionType.ARITHMETIC,
      createdAt: new Date(),
      variables: new Map(),
    };

    it('should save and retrieve expression', async () => {
      const saved = await storageService.saveExpression(mockExpression);
      expect(saved).toBe(true);

      const retrieved = await storageService.getExpression('expr-1');
      expect(retrieved).toEqual(mockExpression);
    });

    it('should return null for non-existent expression', async () => {
      const result = await storageService.getExpression('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('Result Management', () => {
    const mockResult: Result = {
      id: 'result-1',
      expressionId: 'expr-1',
      value: new Decimal(5),
      displayValue: '5',
      format: 'decimal',
      precision: 10,
      unit: null,
      isExact: true,
      computationTime: 10,
      createdAt: new Date(),
    };

    it('should save and retrieve result', async () => {
      const saved = await storageService.saveResult(mockResult);
      expect(saved).toBe(true);

      const retrieved = await storageService.getResult('result-1');
      expect(retrieved).toEqual(mockResult);
    });
  });

  describe('History Management', () => {
    const mockHistory: History = {
      id: 'history-1',
      expressionId: 'expr-1',
      resultId: 'result-1',
      calculatorType: CalculatorType.BASIC,
      timestamp: new Date(),
      isBookmarked: false,
      tags: ['test'],
      notes: 'Test calculation',
    };

    it('should save and retrieve history', async () => {
      const saved = await storageService.saveHistory(mockHistory);
      expect(saved).toBe(true);

      const historyList = await storageService.getHistoryList();
      expect(historyList).toContain(mockHistory);
    });

    it('should filter history by calculator type', async () => {
      await storageService.saveHistory(mockHistory);
      await storageService.saveHistory({
        ...mockHistory,
        id: 'history-2',
        calculatorType: CalculatorType.SCIENTIFIC,
      });

      const basicHistory = await storageService.getHistoryList({
        calculatorType: CalculatorType.BASIC,
      });

      expect(basicHistory).toHaveLength(1);
      expect(basicHistory[0].calculatorType).toBe(CalculatorType.BASIC);
    });

    it('should delete history item', async () => {
      await storageService.saveHistory(mockHistory);

      const deleted = await storageService.deleteHistory('history-1');
      expect(deleted).toBe(true);

      const historyList = await storageService.getHistoryList();
      expect(historyList).not.toContain(mockHistory);
    });

    it('should clear all history', async () => {
      await storageService.saveHistory(mockHistory);

      const cleared = await storageService.clearHistory();
      expect(cleared).toBe(true);

      const historyList = await storageService.getHistoryList();
      expect(historyList).toHaveLength(0);
    });

    it('should support pagination', async () => {
      // 创建多个历史记录
      for (let i = 0; i < 5; i++) {
        await storageService.saveHistory({
          ...mockHistory,
          id: `history-${i}`,
        });
      }

      const page1 = await storageService.getHistoryList({
        limit: 2,
        offset: 0,
      });

      const page2 = await storageService.getHistoryList({
        limit: 2,
        offset: 2,
      });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('Settings Management', () => {
    const mockSettings: Settings = {
      id: 'global',
      angleUnit: 'degree',
      numberFormat: 'decimal',
      precision: 10,
      theme: 'light',
      language: 'zh-CN',
      maxHistoryItems: 1000,
      autoSave: true,
      vibrationEnabled: true,
      soundEnabled: false,
      updatedAt: new Date(),
    };

    it('should save and retrieve settings', async () => {
      const saved = await storageService.saveSettings(mockSettings);
      expect(saved).toBe(true);

      const retrieved = await storageService.getSettings();
      expect(retrieved).toEqual(mockSettings);
    });

    it('should return default settings if none exist', async () => {
      const settings = await storageService.getSettings();
      expect(settings).toBeDefined();
      expect(settings.id).toBe('global');
    });
  });

  describe('Graph Management', () => {
    const mockGraph: Graph = {
      id: 'graph-1',
      expressionId: 'expr-1',
      functionType: '2d',
      domain: { min: -10, max: 10 },
      range: { min: -10, max: 10 },
      resolution: 100,
      points: [{ x: 0, y: 0, z: 0 }],
      style: {
        color: '#007AFF',
        lineWidth: 2,
        lineType: 'solid',
        showPoints: false,
        pointSize: 3,
      },
      viewport: {
        centerX: 0,
        centerY: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      },
      annotations: [],
      createdAt: new Date(),
    };

    it('should save and retrieve graph', async () => {
      const saved = await storageService.saveGraph(mockGraph);
      expect(saved).toBe(true);

      const retrieved = await storageService.getGraph('graph-1');
      expect(retrieved).toEqual(mockGraph);
    });

    it('should delete graph', async () => {
      await storageService.saveGraph(mockGraph);

      const deleted = await storageService.deleteGraph('graph-1');
      expect(deleted).toBe(true);

      const retrieved = await storageService.getGraph('graph-1');
      expect(retrieved).toBeNull();
    });
  });

  describe('Data Export/Import', () => {
    it('should export data with specified options', async () => {
      const mockHistory: History = {
        id: 'history-1',
        expressionId: 'expr-1',
        resultId: 'result-1',
        calculatorType: CalculatorType.BASIC,
        timestamp: new Date(),
        isBookmarked: false,
        tags: [],
        notes: null,
      };

      await storageService.saveHistory(mockHistory);

      const exportData = await storageService.exportData({
        includeHistory: true,
        includeSettings: true,
        format: 'json',
      });

      expect(exportData.version).toBeDefined();
      expect(exportData.timestamp).toBeDefined();
      expect(exportData.history).toContain(mockHistory);
    });

    it('should import data and merge correctly', async () => {
      const importData = {
        version: '1.0.0',
        timestamp: new Date(),
        history: [{
          id: 'imported-history',
          expressionId: 'expr-1',
          resultId: 'result-1',
          calculatorType: CalculatorType.BASIC,
          timestamp: new Date(),
          isBookmarked: false,
          tags: [],
          notes: null,
        }],
      };

      const imported = await storageService.importData(importData, {
        mode: 'merge',
      });

      expect(imported).toBe(true);

      const historyList = await storageService.getHistoryList();
      expect(historyList.some(h => h.id === 'imported-history')).toBe(true);
    });
  });

  describe('Storage Statistics', () => {
    it('should return storage statistics', async () => {
      const stats = await storageService.getStorageStats();

      expect(stats).toBeDefined();
      expect(stats.totalSize).toBeGreaterThanOrEqual(0);
      expect(stats.expressionCount).toBeGreaterThanOrEqual(0);
      expect(stats.resultCount).toBeGreaterThanOrEqual(0);
      expect(stats.historyCount).toBeGreaterThanOrEqual(0);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup old data based on retention policy', async () => {
      // 创建旧的历史记录
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      await storageService.saveHistory({
        id: 'old-history',
        expressionId: 'expr-1',
        resultId: 'result-1',
        calculatorType: CalculatorType.BASIC,
        timestamp: oldDate,
        isBookmarked: false,
        tags: [],
        notes: null,
      });

      const cleanedCount = await storageService.cleanup({
        retentionDays: 30,
        maxHistoryItems: 100,
      });

      expect(cleanedCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw StorageError for invalid operations', async () => {
      // 测试无效的数据保存
      await expect(
        storageService.saveExpression(null as any)
      ).rejects.toThrow(StorageError);
    });

    it('should handle data corruption gracefully', async () => {
      // 模拟数据损坏场景
      // 这需要在实现中具体测试
      await expect(
        storageService.getExpression('corrupted-data')
      ).resolves.not.toThrow();
    });
  });
});