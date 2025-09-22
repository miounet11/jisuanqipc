/**
 * History Model
 *
 * 计算历史记录的模型实现，包含查询、过滤和管理功能
 */

import {
  History,
  HistoryQueryOptions,
  HistoryGroup,
  HistoryStatistics,
  HistoryExportOptions,
  HistoryValidationRules,
  CalculatorType,
} from '@/types';

// 简化的UUID生成器
const generateUUID = (): string => {
  return 'history-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
};

export class HistoryModel implements History {
  public readonly id: string;
  public readonly expressionId: string;
  public readonly resultId: string;
  public readonly calculatorType: CalculatorType;
  public readonly timestamp: Date;
  public isBookmarked: boolean;
  public tags: string[];
  public notes: string | null;

  private static readonly DEFAULT_VALIDATION_RULES: HistoryValidationRules = {
    maxNotesLength: 500,
    maxTagLength: 50,
    maxTagsPerHistory: 10,
    retentionDays: 365,
  };

  constructor(
    expressionId: string,
    resultId: string,
    calculatorType: CalculatorType,
    options: {
      isBookmarked?: boolean;
      tags?: string[];
      notes?: string | null;
      timestamp?: Date;
      id?: string;
    } = {}
  ) {
    this.id = options.id || generateUUID();
    this.expressionId = expressionId;
    this.resultId = resultId;
    this.calculatorType = calculatorType;
    this.timestamp = options.timestamp || new Date();
    this.isBookmarked = options.isBookmarked || false;
    this.tags = options.tags || [];
    this.notes = options.notes || null;

    this.validate();
  }

  /**
   * 验证历史记录数据
   */
  private validate(): void {
    const rules = HistoryModel.DEFAULT_VALIDATION_RULES;

    if (!this.expressionId || this.expressionId.trim().length === 0) {
      throw new Error('历史记录必须关联有效的表达式ID');
    }

    if (!this.resultId || this.resultId.trim().length === 0) {
      throw new Error('历史记录必须关联有效的结果ID');
    }

    if (!Object.values(CalculatorType).includes(this.calculatorType)) {
      throw new Error(`无效的计算器类型: ${this.calculatorType}`);
    }

    if (this.notes && this.notes.length > rules.maxNotesLength) {
      throw new Error(`备注长度不能超过 ${rules.maxNotesLength} 个字符`);
    }

    if (this.tags.length > rules.maxTagsPerHistory) {
      throw new Error(`标签数量不能超过 ${rules.maxTagsPerHistory} 个`);
    }

    for (const tag of this.tags) {
      if (tag.length > rules.maxTagLength) {
        throw new Error(`标签长度不能超过 ${rules.maxTagLength} 个字符`);
      }
    }
  }

  /**
   * 添加标签
   */
  public addTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();

    if (!normalizedTag) {
      throw new Error('标签不能为空');
    }

    if (this.tags.includes(normalizedTag)) {
      return; // 标签已存在
    }

    this.tags.push(normalizedTag);
    this.validate();
  }

  /**
   * 移除标签
   */
  public removeTag(tag: string): boolean {
    const normalizedTag = tag.trim().toLowerCase();
    const index = this.tags.indexOf(normalizedTag);

    if (index === -1) {
      return false;
    }

    this.tags.splice(index, 1);
    return true;
  }

  /**
   * 切换收藏状态
   */
  public toggleBookmark(): void {
    this.isBookmarked = !this.isBookmarked;
  }

  /**
   * 更新备注
   */
  public updateNotes(notes: string | null): void {
    this.notes = notes;
    this.validate();
  }

  /**
   * 匹配查询条件
   */
  public matchesQuery(options: HistoryQueryOptions): boolean {
    // 计算器类型过滤
    if (options.calculatorType && options.calculatorType.length > 0) {
      if (!options.calculatorType.includes(this.calculatorType)) {
        return false;
      }
    }

    // 日期范围过滤
    if (options.startDate && this.timestamp < options.startDate) {
      return false;
    }

    if (options.endDate && this.timestamp > options.endDate) {
      return false;
    }

    // 收藏状态过滤
    if (options.bookmarkedOnly && !this.isBookmarked) {
      return false;
    }

    // 标签过滤
    if (options.tags && options.tags.length > 0) {
      const hasMatchingTag = options.tags.some(tag =>
        this.tags.includes(tag.toLowerCase())
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    // 文本搜索
    if (options.searchText) {
      const searchLower = options.searchText.toLowerCase();
      const searchTargets = [
        this.notes || '',
        ...this.tags,
        this.calculatorType,
      ].join(' ').toLowerCase();

      if (!searchTargets.includes(searchLower)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取历史记录的显示信息
   */
  public getDisplayInfo(): {
    title: string;
    subtitle: string;
    badge: string;
    icon: string;
  } {
    const calculatorNames = {
      [CalculatorType.BASIC]: '基础计算器',
      [CalculatorType.SCIENTIFIC]: '科学计算器',
      [CalculatorType.GRAPHING]: '图形计算器',
      [CalculatorType.GEOMETRY]: '几何计算器',
      [CalculatorType.EQUATION]: '方程求解器',
      [CalculatorType.LOGIC]: '逻辑计算器',
      [CalculatorType.EXPRESSION]: '表达式简化器',
      [CalculatorType.BINOMIAL]: '二项式展开器',
      [CalculatorType.MATRIX]: '矩阵计算器',
    };

    const calculatorIcons = {
      [CalculatorType.BASIC]: '🔢',
      [CalculatorType.SCIENTIFIC]: '🧮',
      [CalculatorType.GRAPHING]: '📈',
      [CalculatorType.GEOMETRY]: '📐',
      [CalculatorType.EQUATION]: '✖️',
      [CalculatorType.LOGIC]: '🔧',
      [CalculatorType.EXPRESSION]: '📝',
      [CalculatorType.BINOMIAL]: '📊',
      [CalculatorType.MATRIX]: '⬛',
    };

    return {
      title: calculatorNames[this.calculatorType],
      subtitle: this.formatTimestamp(),
      badge: this.isBookmarked ? '⭐' : '',
      icon: calculatorIcons[this.calculatorType],
    };
  }

  /**
   * 格式化时间戳
   */
  private formatTimestamp(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return '刚刚';
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 30) {
      return `${diffDays}天前`;
    } else {
      return this.timestamp.toLocaleDateString('zh-CN');
    }
  }

  /**
   * 导出为指定格式
   */
  public export(format: 'json' | 'csv' | 'txt'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.toJSON(), null, 2);

      case 'csv':
        return [
          this.id,
          this.expressionId,
          this.resultId,
          this.calculatorType,
          this.timestamp.toISOString(),
          this.isBookmarked.toString(),
          this.tags.join(';'),
          this.notes || '',
        ].map(field => `"${field}"`).join(',');

      case 'txt':
        return [
          `ID: ${this.id}`,
          `类型: ${this.getDisplayInfo().title}`,
          `时间: ${this.timestamp.toLocaleString('zh-CN')}`,
          `表达式ID: ${this.expressionId}`,
          `结果ID: ${this.resultId}`,
          `收藏: ${this.isBookmarked ? '是' : '否'}`,
          `标签: ${this.tags.join(', ') || '无'}`,
          `备注: ${this.notes || '无'}`,
        ].join('\n');

      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }

  /**
   * 克隆历史记录
   */
  public clone(): HistoryModel {
    return new HistoryModel(
      this.expressionId,
      this.resultId,
      this.calculatorType,
      {
        isBookmarked: this.isBookmarked,
        tags: [...this.tags],
        notes: this.notes,
        timestamp: new Date(this.timestamp),
        id: this.id,
      }
    );
  }

  /**
   * 序列化为JSON
   */
  public toJSON(): History {
    return {
      id: this.id,
      expressionId: this.expressionId,
      resultId: this.resultId,
      calculatorType: this.calculatorType,
      timestamp: this.timestamp,
      isBookmarked: this.isBookmarked,
      tags: this.tags,
      notes: this.notes,
    };
  }

  /**
   * 从JSON反序列化
   */
  public static fromJSON(data: History): HistoryModel {
    return new HistoryModel(
      data.expressionId,
      data.resultId,
      data.calculatorType,
      {
        isBookmarked: data.isBookmarked,
        tags: data.tags,
        notes: data.notes,
        timestamp: new Date(data.timestamp),
        id: data.id,
      }
    );
  }

  /**
   * 查询历史记录列表
   */
  public static queryHistory(
    histories: HistoryModel[],
    options: HistoryQueryOptions = {}
  ): HistoryModel[] {
    let filtered = histories.filter(history => history.matchesQuery(options));

    // 排序
    const orderBy = options.orderBy || 'timestamp';
    const order = options.order || 'desc';

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (orderBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
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
      filtered = filtered.slice(offset, offset + options.limit);
    }

    return filtered;
  }

  /**
   * 按条件分组历史记录
   */
  public static groupHistory(
    histories: HistoryModel[],
    groupBy: 'type' | 'date' | 'bookmarked'
  ): HistoryGroup[] {
    const groups = new Map<string, HistoryModel[]>();

    for (const history of histories) {
      let key: string;

      switch (groupBy) {
        case 'type':
          key = history.calculatorType;
          break;
        case 'date':
          key = history.timestamp.toDateString();
          break;
        case 'bookmarked':
          key = history.isBookmarked ? 'bookmarked' : 'regular';
          break;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(history);
    }

    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      items,
      count: items.length,
    }));
  }

  /**
   * 生成历史记录统计信息
   */
  public static generateStatistics(histories: HistoryModel[]): HistoryStatistics {
    const byCalculatorType = {} as Record<CalculatorType, number>;
    const byDateRange = {} as Record<string, number>;
    const tagCounts = new Map<string, number>();

    // 初始化计算器类型统计
    Object.values(CalculatorType).forEach(type => {
      byCalculatorType[type] = 0;
    });

    for (const history of histories) {
      // 按计算器类型统计
      byCalculatorType[history.calculatorType]++;

      // 按日期统计
      const dateKey = history.timestamp.toDateString();
      byDateRange[dateKey] = (byDateRange[dateKey] || 0) + 1;

      // 标签统计
      for (const tag of history.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    // 最常用标签
    const mostUsedTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 计算平均会话长度（简化计算）
    const averageSessionLength = histories.length > 0
      ? histories.reduce((sum, h) => sum + (h.tags.length + 1), 0) / histories.length
      : 0;

    return {
      totalCount: histories.length,
      byCalculatorType,
      byDateRange,
      mostUsedTags,
      averageSessionLength,
    };
  }

  /**
   * 批量导出历史记录
   */
  public static exportHistories(
    histories: HistoryModel[],
    options: HistoryExportOptions
  ): string {
    let filteredHistories = histories;

    // 日期范围过滤
    if (options.dateRange) {
      filteredHistories = histories.filter(h =>
        h.timestamp >= options.dateRange!.start &&
        h.timestamp <= options.dateRange!.end
      );
    }

    switch (options.format) {
      case 'json':
        return JSON.stringify(
          filteredHistories.map(h => h.toJSON()),
          null,
          2
        );

      case 'csv':
        const headers = [
          'ID', '表达式ID', '结果ID', '计算器类型', '时间戳',
          '收藏状态', '标签', '备注'
        ];
        const rows = filteredHistories.map(h => h.export('csv'));
        return [headers.join(','), ...rows].join('\n');

      case 'txt':
        return filteredHistories
          .map(h => h.export('txt'))
          .join('\n' + '='.repeat(50) + '\n');

      default:
        throw new Error(`不支持的导出格式: ${options.format}`);
    }
  }
}