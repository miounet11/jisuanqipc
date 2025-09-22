/**
 * Settings Type Definitions
 *
 * 应用设置和用户偏好的类型定义
 */

export enum AngleUnit {
  DEGREE = 'degree',             // 角度
  RADIAN = 'radian',             // 弧度
  GRADIAN = 'gradian',           // 百分度
}

export enum NumberFormat {
  AUTOMATIC = 'automatic',       // 自动选择格式
  DECIMAL = 'decimal',           // 十进制
  SCIENTIFIC = 'scientific',     // 科学计数法
  ENGINEERING = 'engineering',   // 工程记数法
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

export interface Settings {
  id: string;
  angleUnit: AngleUnit;
  numberFormat: NumberFormat;
  precision: number;
  theme: Theme;
  language: string;
  maxHistoryItems: number;
  autoSave: boolean;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  updatedAt: Date;
}

export interface SettingsValidation {
  precision: {
    min: number;
    max: number;
  };
  maxHistoryItems: {
    min: number;
    max: number;
  };
  supportedLanguages: string[];
  supportedThemes: Theme[];
}

export interface SettingsDefaults {
  angleUnit: AngleUnit;
  numberFormat: NumberFormat;
  precision: number;
  theme: Theme;
  language: string;
  maxHistoryItems: number;
  autoSave: boolean;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}

export interface SettingsUpdate {
  [key: string]: unknown;
}

export interface SettingsBackup {
  version: string;
  timestamp: Date;
  settings: Settings;
  checksum: string;
}