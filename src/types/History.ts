/**
 * History Type Definitions
 *
 * 计算历史记录的类型定义，支持查询、过滤和管理
 */

export enum CalculatorType {
  BASIC = 'basic',
  SCIENTIFIC = 'scientific',
  GRAPHING = 'graphing',
  GEOMETRY = 'geometry',
  EQUATION = 'equation',
  LOGIC = 'logic',
  EXPRESSION = 'expression',
  BINOMIAL = 'binomial',
  MATRIX = 'matrix',
}

export interface History {
  id: string;
  expressionId: string;
  resultId: string;
  calculatorType: CalculatorType;
  timestamp: Date;
  isBookmarked: boolean;
  tags: string[];
  notes: string | null;
}

export interface HistoryQueryOptions {
  calculatorType?: CalculatorType[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  orderBy?: 'timestamp' | 'type' | 'bookmarked';
  order?: 'asc' | 'desc';
  bookmarkedOnly?: boolean;
  tags?: string[];
  searchText?: string;
}

export interface HistoryGroup {
  key: string;
  items: History[];
  count: number;
}

export interface HistoryStatistics {
  totalCount: number;
  byCalculatorType: Record<CalculatorType, number>;
  byDateRange: Record<string, number>;
  mostUsedTags: Array<{ tag: string; count: number }>;
  averageSessionLength: number;
}

export interface HistoryExportOptions {
  format: 'json' | 'csv' | 'txt';
  includeResults?: boolean;
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface HistoryValidationRules {
  maxNotesLength: number;
  maxTagLength: number;
  maxTagsPerHistory: number;
  retentionDays: number;
}