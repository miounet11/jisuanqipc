/**
 * Storage Service
 *
 * 数据存储服务的实现，负责本地数据持久化和管理
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Expression,
  Result,
  History,
  Settings,
  Graph,
  HistoryQueryOptions,
  CalculatorType,
} from '@/types';
import { SettingsModel } from '@/models/Settings';

// 自定义错误类
export class StorageError extends Error {
  constructor(message: string, public operation?: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class DataCorruptionError extends Error {
  constructor(message: string, public key?: string) {
    super(message);
    this.name = 'DataCorruptionError';
  }
}

// 存储键常量
const STORAGE_KEYS = {
  EXPRESSIONS: 'calculator_expressions',
  RESULTS: 'calculator_results',
  HISTORY: 'calculator_history',
  SETTINGS: 'calculator_settings',
  GRAPHS: 'calculator_graphs',
  METADATA: 'calculator_metadata',
} as const;

// 存储统计信息接口
export interface StorageStats {
  totalSize: number;
  expressionCount: number;
  resultCount: number;
  historyCount: number;
  graphCount: number;
  lastUpdated: Date;
}

// 导出选项接口
export interface ExportOptions {
  includeHistory?: boolean;
  includeSettings?: boolean;
  includeGraphs?: boolean;
  format: 'json' | 'csv';
}

// 导入选项接口
export interface ImportOptions {
  mode: 'merge' | 'replace';
  validateData?: boolean;
}

// 清理选项接口
export interface CleanupOptions {
  retentionDays?: number;
  maxHistoryItems?: number;
  removeOrphaned?: boolean;
}

// 导出数据结构
export interface ExportData {
  version: string;
  timestamp: Date;
  expressions?: Expression[];
  results?: Result[];
  history?: History[];
  settings?: Settings;
  graphs?: Graph[];
}

export class StorageService {
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  constructor() {
    this.initializeMetadata();
  }

  /**
   * 初始化元数据
   */
  private async initializeMetadata(): Promise<void> {
    try {
      const metadata = await AsyncStorage.getItem(STORAGE_KEYS.METADATA);
      if (!metadata) {
        const initialMetadata = {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(initialMetadata));
      }
    } catch (error) {
      console.warn('Failed to initialize storage metadata:', error);
    }
  }

  /**
   * 更新元数据
   */
  private async updateMetadata(): Promise<void> {
    try {
      const metadata = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.warn('Failed to update metadata:', error);
    }
  }

  /**
   * 缓存管理
   */
  private setCacheItem(key: string, value: any): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  private getCacheItem(key: string): any | null {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  private clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * 通用存储方法
   */
  private async setItem(key: string, value: any): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, serializedValue);
      this.setCacheItem(key, value);
      await this.updateMetadata();
      return true;
    } catch (error) {
      throw new StorageError(
        `存储失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'setItem'
      );
    }
  }

  /**
   * 通用获取方法
   */
  private async getItem<T>(key: string): Promise<T | null> {
    try {
      // 先检查缓存
      const cached = this.getCacheItem(key);
      if (cached !== null) {
        return cached;
      }

      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        return null;
      }

      const parsed = JSON.parse(value);
      this.setCacheItem(key, parsed);
      return parsed;
    } catch (error) {
      console.warn(`Failed to get item ${key}:`, error);
      return null;
    }
  }

  /**
   * 通用删除方法
   */
  private async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      await this.updateMetadata();
      return true;
    } catch (error) {
      throw new StorageError(
        `删除失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'removeItem'
      );
    }
  }

  /**
   * 表达式管理
   */
  public async saveExpression(expression: Expression): Promise<boolean> {
    if (!expression || !expression.id) {
      throw new StorageError('无效的表达式对象');
    }

    try {
      const expressions = await this.getAllExpressions();
      const existingIndex = expressions.findIndex(e => e.id === expression.id);

      if (existingIndex >= 0) {
        expressions[existingIndex] = expression;
      } else {
        expressions.push(expression);
      }

      return await this.setItem(STORAGE_KEYS.EXPRESSIONS, expressions);
    } catch (error) {
      throw new StorageError(
        `保存表达式失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  public async getExpression(id: string): Promise<Expression | null> {
    try {
      const expressions = await this.getAllExpressions();
      return expressions.find(e => e.id === id) || null;
    } catch (error) {
      console.warn('Failed to get expression:', error);
      return null;
    }
  }

  private async getAllExpressions(): Promise<Expression[]> {
    return (await this.getItem<Expression[]>(STORAGE_KEYS.EXPRESSIONS)) || [];
  }

  /**
   * 结果管理
   */
  public async saveResult(result: Result): Promise<boolean> {
    if (!result || !result.id) {
      throw new StorageError('无效的结果对象');
    }

    try {
      const results = await this.getAllResults();
      const existingIndex = results.findIndex(r => r.id === result.id);

      if (existingIndex >= 0) {
        results[existingIndex] = result;
      } else {
        results.push(result);
      }

      return await this.setItem(STORAGE_KEYS.RESULTS, results);
    } catch (error) {
      throw new StorageError(
        `保存结果失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  public async getResult(id: string): Promise<Result | null> {
    try {
      const results = await this.getAllResults();
      return results.find(r => r.id === id) || null;
    } catch (error) {
      console.warn('Failed to get result:', error);
      return null;
    }
  }

  private async getAllResults(): Promise<Result[]> {
    return (await this.getItem<Result[]>(STORAGE_KEYS.RESULTS)) || [];
  }

  /**
   * 历史记录管理
   */
  public async saveHistory(history: History): Promise<boolean> {
    if (!history || !history.id) {
      throw new StorageError('无效的历史记录对象');
    }

    try {
      const historyList = await this.getAllHistory();
      const existingIndex = historyList.findIndex(h => h.id === history.id);

      if (existingIndex >= 0) {
        historyList[existingIndex] = history;
      } else {
        historyList.push(history);
      }

      return await this.setItem(STORAGE_KEYS.HISTORY, historyList);
    } catch (error) {
      throw new StorageError(
        `保存历史记录失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  public async getHistoryList(options: HistoryQueryOptions = {}): Promise<History[]> {
    try {
      let historyList = await this.getAllHistory();

      // 应用过滤条件
      if (options.calculatorType && options.calculatorType.length > 0) {
        historyList = historyList.filter(h =>
          options.calculatorType!.includes(h.calculatorType)
        );
      }

      if (options.startDate) {
        historyList = historyList.filter(h =>
          new Date(h.timestamp) >= options.startDate!
        );
      }

      if (options.endDate) {
        historyList = historyList.filter(h =>
          new Date(h.timestamp) <= options.endDate!
        );
      }

      if (options.bookmarkedOnly) {
        historyList = historyList.filter(h => h.isBookmarked);
      }

      if (options.tags && options.tags.length > 0) {
        historyList = historyList.filter(h =>
          options.tags!.some(tag => h.tags.includes(tag))
        );
      }

      if (options.searchText) {
        const searchLower = options.searchText.toLowerCase();
        historyList = historyList.filter(h =>
          h.notes?.toLowerCase().includes(searchLower) ||
          h.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // 排序
      const orderBy = options.orderBy || 'timestamp';
      const order = options.order || 'desc';

      historyList.sort((a, b) => {
        let comparison = 0;

        switch (orderBy) {
          case 'timestamp':
            comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            break;
          case 'type':
            comparison = a.calculatorType.localeCompare(b.calculatorType);
            break;
          case 'bookmarked':
            comparison = (a.isBookmarked ? 1 : 0) - (b.isBookmarked ? 1 : 0);
            break;
        }

        return order === 'desc' ? -comparison : comparison;
      });

      // 分页
      if (options.limit !== undefined) {
        const offset = options.offset || 0;
        historyList = historyList.slice(offset, offset + options.limit);
      }

      return historyList;
    } catch (error) {
      console.warn('Failed to get history list:', error);
      return [];
    }
  }

  public async deleteHistory(id: string): Promise<boolean> {
    try {
      const historyList = await this.getAllHistory();
      const filteredList = historyList.filter(h => h.id !== id);

      if (filteredList.length === historyList.length) {
        return false; // 没有找到要删除的项
      }

      return await this.setItem(STORAGE_KEYS.HISTORY, filteredList);
    } catch (error) {
      throw new StorageError(
        `删除历史记录失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  public async clearHistory(): Promise<boolean> {
    try {
      return await this.setItem(STORAGE_KEYS.HISTORY, []);
    } catch (error) {
      throw new StorageError(
        `清空历史记录失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  private async getAllHistory(): Promise<History[]> {
    return (await this.getItem<History[]>(STORAGE_KEYS.HISTORY)) || [];
  }

  /**
   * 设置管理
   */
  public async saveSettings(settings: Settings): Promise<boolean> {
    if (!settings) {
      throw new StorageError('无效的设置对象');
    }

    try {
      return await this.setItem(STORAGE_KEYS.SETTINGS, settings);
    } catch (error) {
      throw new StorageError(
        `保存设置失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  public async getSettings(): Promise<Settings> {
    try {
      const settings = await this.getItem<Settings>(STORAGE_KEYS.SETTINGS);
      if (settings) {
        return settings;
      }

      // 返回默认设置
      const defaultSettings = SettingsModel.createDefault();
      await this.saveSettings(defaultSettings.toJSON());
      return defaultSettings.toJSON();
    } catch (error) {
      console.warn('Failed to get settings, using defaults:', error);
      return SettingsModel.createDefault().toJSON();
    }
  }

  /**
   * 图形管理
   */
  public async saveGraph(graph: Graph): Promise<boolean> {
    if (!graph || !graph.id) {
      throw new StorageError('无效的图形对象');
    }

    try {
      const graphs = await this.getAllGraphs();
      const existingIndex = graphs.findIndex(g => g.id === graph.id);

      if (existingIndex >= 0) {
        graphs[existingIndex] = graph;
      } else {
        graphs.push(graph);
      }

      return await this.setItem(STORAGE_KEYS.GRAPHS, graphs);
    } catch (error) {
      throw new StorageError(
        `保存图形失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  public async getGraph(id: string): Promise<Graph | null> {
    try {
      const graphs = await this.getAllGraphs();
      return graphs.find(g => g.id === id) || null;
    } catch (error) {
      console.warn('Failed to get graph:', error);
      return null;
    }
  }

  public async deleteGraph(id: string): Promise<boolean> {
    try {
      const graphs = await this.getAllGraphs();
      const filteredGraphs = graphs.filter(g => g.id !== id);

      if (filteredGraphs.length === graphs.length) {
        return false; // 没有找到要删除的项
      }

      return await this.setItem(STORAGE_KEYS.GRAPHS, filteredGraphs);
    } catch (error) {
      throw new StorageError(
        `删除图形失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  private async getAllGraphs(): Promise<Graph[]> {
    return (await this.getItem<Graph[]>(STORAGE_KEYS.GRAPHS)) || [];
  }

  /**
   * 数据导出
   */
  public async exportData(options: ExportOptions): Promise<ExportData> {
    try {
      const exportData: ExportData = {
        version: '1.0.0',
        timestamp: new Date(),
      };

      if (options.includeHistory) {
        exportData.history = await this.getAllHistory();
      }

      if (options.includeSettings) {
        exportData.settings = await this.getSettings();
      }

      if (options.includeGraphs) {
        exportData.graphs = await this.getAllGraphs();
      }

      // 总是包含表达式和结果
      exportData.expressions = await this.getAllExpressions();
      exportData.results = await this.getAllResults();

      return exportData;
    } catch (error) {
      throw new StorageError(
        `导出数据失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 数据导入
   */
  public async importData(data: ExportData, options: ImportOptions): Promise<boolean> {
    try {
      if (options.validateData) {
        this.validateImportData(data);
      }

      if (options.mode === 'replace') {
        // 清空现有数据
        await this.clearAllData();
      }

      // 导入数据
      if (data.expressions) {
        for (const expression of data.expressions) {
          await this.saveExpression(expression);
        }
      }

      if (data.results) {
        for (const result of data.results) {
          await this.saveResult(result);
        }
      }

      if (data.history) {
        for (const history of data.history) {
          await this.saveHistory(history);
        }
      }

      if (data.settings) {
        await this.saveSettings(data.settings);
      }

      if (data.graphs) {
        for (const graph of data.graphs) {
          await this.saveGraph(graph);
        }
      }

      this.clearCache(); // 清空缓存
      return true;
    } catch (error) {
      throw new StorageError(
        `导入数据失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 验证导入数据
   */
  private validateImportData(data: ExportData): void {
    if (!data.version || !data.timestamp) {
      throw new DataCorruptionError('导入数据格式无效');
    }

    // 可以添加更多验证逻辑
  }

  /**
   * 获取存储统计信息
   */
  public async getStorageStats(): Promise<StorageStats> {
    try {
      const [expressions, results, history, graphs] = await Promise.all([
        this.getAllExpressions(),
        this.getAllResults(),
        this.getAllHistory(),
        this.getAllGraphs(),
      ]);

      // 估算存储大小
      const totalSize = this.estimateStorageSize({
        expressions,
        results,
        history,
        graphs,
      });

      return {
        totalSize,
        expressionCount: expressions.length,
        resultCount: results.length,
        historyCount: history.length,
        graphCount: graphs.length,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.warn('Failed to get storage stats:', error);
      return {
        totalSize: 0,
        expressionCount: 0,
        resultCount: 0,
        historyCount: 0,
        graphCount: 0,
        lastUpdated: new Date(),
      };
    }
  }

  /**
   * 估算存储大小
   */
  private estimateStorageSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // UTF-16编码，每字符2字节
    } catch {
      return 0;
    }
  }

  /**
   * 清理操作
   */
  public async cleanup(options: CleanupOptions): Promise<number> {
    let cleanedCount = 0;

    try {
      const history = await this.getAllHistory();

      // 按保留天数清理
      if (options.retentionDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - options.retentionDays);

        const filteredHistory = history.filter(h => {
          if (h.isBookmarked) return true; // 保留收藏的记录
          return new Date(h.timestamp) >= cutoffDate;
        });

        cleanedCount += history.length - filteredHistory.length;
        await this.setItem(STORAGE_KEYS.HISTORY, filteredHistory);
      }

      // 按最大数量清理
      if (options.maxHistoryItems) {
        const currentHistory = await this.getAllHistory();
        if (currentHistory.length > options.maxHistoryItems) {
          // 保留最新的记录和收藏的记录
          const sortedHistory = currentHistory.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          const bookmarked = sortedHistory.filter(h => h.isBookmarked);
          const recent = sortedHistory
            .filter(h => !h.isBookmarked)
            .slice(0, options.maxHistoryItems - bookmarked.length);

          const filteredHistory = [...bookmarked, ...recent];
          cleanedCount += currentHistory.length - filteredHistory.length;
          await this.setItem(STORAGE_KEYS.HISTORY, filteredHistory);
        }
      }

      // 清理孤立的数据
      if (options.removeOrphaned) {
        cleanedCount += await this.removeOrphanedData();
      }

      this.clearCache(); // 清空缓存
      return cleanedCount;
    } catch (error) {
      throw new StorageError(
        `清理操作失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 移除孤立的数据
   */
  private async removeOrphanedData(): Promise<number> {
    let removedCount = 0;

    try {
      const [history, expressions, results] = await Promise.all([
        this.getAllHistory(),
        this.getAllExpressions(),
        this.getAllResults(),
      ]);

      const expressionIds = new Set(expressions.map(e => e.id));
      const resultIds = new Set(results.map(r => r.id));

      // 移除引用不存在表达式或结果的历史记录
      const validHistory = history.filter(h => {
        const hasValidExpression = expressionIds.has(h.expressionId);
        const hasValidResult = resultIds.has(h.resultId);

        if (!hasValidExpression || !hasValidResult) {
          removedCount++;
          return false;
        }
        return true;
      });

      if (removedCount > 0) {
        await this.setItem(STORAGE_KEYS.HISTORY, validHistory);
      }

      return removedCount;
    } catch (error) {
      console.warn('Failed to remove orphaned data:', error);
      return 0;
    }
  }

  /**
   * 清空所有数据
   */
  private async clearAllData(): Promise<void> {
    const keys = Object.values(STORAGE_KEYS);

    await Promise.all(
      keys.map(key => this.removeItem(key))
    );

    this.clearCache();
  }

  /**
   * 获取所有存储键
   */
  public async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.warn('Failed to get all keys:', error);
      return [];
    }
  }

  /**
   * 检查存储健康状态
   */
  public async checkStorageHealth(): Promise<{
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const stats = await this.getStorageStats();

      // 检查存储大小
      if (stats.totalSize > 10 * 1024 * 1024) { // 10MB
        issues.push('存储空间使用过多');
        recommendations.push('考虑清理旧数据或导出部分数据');
      }

      // 检查历史记录数量
      if (stats.historyCount > 5000) {
        issues.push('历史记录过多');
        recommendations.push('运行清理操作以删除旧记录');
      }

      // 检查数据完整性
      const orphanedCount = await this.removeOrphanedData();
      if (orphanedCount > 0) {
        issues.push(`发现${orphanedCount}条孤立数据`);
        recommendations.push('运行数据清理以移除孤立数据');
      }

      return {
        isHealthy: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      return {
        isHealthy: false,
        issues: ['无法检查存储健康状态'],
        recommendations: ['重启应用或重新初始化存储'],
      };
    }
  }
}