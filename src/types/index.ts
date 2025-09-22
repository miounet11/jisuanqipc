/**
 * Type Definitions Index
 *
 * 汇总所有类型定义的入口文件
 */

// Expression types
export * from './Expression';

// Result types
export * from './Result';

// History types
export * from './History';

// Settings types
export * from './Settings';

// Graph types
export * from './Graph';

// Common utility types
export interface ErrorInfo {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AsyncResult<T> {
  success: boolean;
  data?: T;
  error?: ErrorInfo;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface KeyValue<T = unknown> {
  [key: string]: T;
}

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event types
export interface AppEvent {
  type: string;
  timestamp: Date;
  data?: unknown;
}

// Configuration types
export interface AppConfig {
  version: string;
  buildNumber: string;
  environment: 'development' | 'production' | 'testing';
  features: {
    debugMode: boolean;
    analyticsEnabled: boolean;
    crashReportingEnabled: boolean;
  };
}