/**
 * Settings Model
 *
 * 应用设置和用户偏好的模型实现，包含默认值和验证逻辑
 */

import {
  Settings,
  SettingsValidation,
  SettingsDefaults,
  SettingsUpdate,
  SettingsBackup,
  AngleUnit,
  NumberFormat,
  Theme,
} from '@/types';

export class SettingsModel implements Settings {
  public readonly id: string;
  public angleUnit: AngleUnit;
  public numberFormat: NumberFormat;
  public precision: number;
  public theme: Theme;
  public language: string;
  public maxHistoryItems: number;
  public autoSave: boolean;
  public vibrationEnabled: boolean;
  public soundEnabled: boolean;
  public updatedAt: Date;

  private static readonly DEFAULTS: SettingsDefaults = {
    angleUnit: AngleUnit.DEGREE,
    numberFormat: NumberFormat.AUTOMATIC,
    precision: 10,
    theme: Theme.AUTO,
    language: 'zh-CN',
    maxHistoryItems: 1000,
    autoSave: true,
    vibrationEnabled: true,
    soundEnabled: false,
  };

  private static readonly VALIDATION: SettingsValidation = {
    precision: {
      min: 1,
      max: 50,
    },
    maxHistoryItems: {
      min: 10,
      max: 10000,
    },
    supportedLanguages: [
      'zh-CN',
      'zh-TW',
      'en-US',
      'en-GB',
      'ja-JP',
      'ko-KR',
      'fr-FR',
      'de-DE',
      'es-ES',
      'pt-BR',
      'ru-RU',
      'ar-SA',
    ],
    supportedThemes: [Theme.LIGHT, Theme.DARK, Theme.AUTO],
  };

  constructor(initialSettings?: Partial<Settings>) {
    this.id = 'global';
    const defaults = SettingsModel.DEFAULTS;

    this.angleUnit = initialSettings?.angleUnit ?? defaults.angleUnit;
    this.numberFormat = initialSettings?.numberFormat ?? defaults.numberFormat;
    this.precision = initialSettings?.precision ?? defaults.precision;
    this.theme = initialSettings?.theme ?? defaults.theme;
    this.language = initialSettings?.language ?? defaults.language;
    this.maxHistoryItems = initialSettings?.maxHistoryItems ?? defaults.maxHistoryItems;
    this.autoSave = initialSettings?.autoSave ?? defaults.autoSave;
    this.vibrationEnabled = initialSettings?.vibrationEnabled ?? defaults.vibrationEnabled;
    this.soundEnabled = initialSettings?.soundEnabled ?? defaults.soundEnabled;
    this.updatedAt = initialSettings?.updatedAt ?? new Date();

    this.validate();
  }

  /**
   * 验证设置值
   */
  private validate(): void {
    const validation = SettingsModel.VALIDATION;

    // 验证精度
    if (this.precision < validation.precision.min || this.precision > validation.precision.max) {
      throw new Error(
        `精度必须在 ${validation.precision.min} 到 ${validation.precision.max} 之间`
      );
    }

    // 验证历史记录最大数量
    if (
      this.maxHistoryItems < validation.maxHistoryItems.min ||
      this.maxHistoryItems > validation.maxHistoryItems.max
    ) {
      throw new Error(
        `历史记录最大数量必须在 ${validation.maxHistoryItems.min} 到 ${validation.maxHistoryItems.max} 之间`
      );
    }

    // 验证语言
    if (!validation.supportedLanguages.includes(this.language)) {
      throw new Error(`不支持的语言: ${this.language}`);
    }

    // 验证主题
    if (!validation.supportedThemes.includes(this.theme)) {
      throw new Error(`不支持的主题: ${this.theme}`);
    }

    // 验证角度单位
    if (!Object.values(AngleUnit).includes(this.angleUnit)) {
      throw new Error(`无效的角度单位: ${this.angleUnit}`);
    }

    // 验证数字格式
    if (!Object.values(NumberFormat).includes(this.numberFormat)) {
      throw new Error(`无效的数字格式: ${this.numberFormat}`);
    }
  }

  /**
   * 更新设置
   */
  public update(updates: SettingsUpdate): boolean {
    const previousState = this.clone();

    try {
      // 应用更新
      Object.keys(updates).forEach(key => {
        if (key in this && key !== 'id' && key !== 'updatedAt') {
          (this as any)[key] = updates[key];
        }
      });

      this.updatedAt = new Date();
      this.validate();
      return true;
    } catch (error) {
      // 回滚到之前的状态
      this.restoreFrom(previousState);
      throw error;
    }
  }

  /**
   * 从另一个设置对象恢复状态
   */
  private restoreFrom(settings: SettingsModel): void {
    this.angleUnit = settings.angleUnit;
    this.numberFormat = settings.numberFormat;
    this.precision = settings.precision;
    this.theme = settings.theme;
    this.language = settings.language;
    this.maxHistoryItems = settings.maxHistoryItems;
    this.autoSave = settings.autoSave;
    this.vibrationEnabled = settings.vibrationEnabled;
    this.soundEnabled = settings.soundEnabled;
    this.updatedAt = settings.updatedAt;
  }

  /**
   * 重置为默认值
   */
  public resetToDefaults(): void {
    const defaults = SettingsModel.DEFAULTS;

    this.angleUnit = defaults.angleUnit;
    this.numberFormat = defaults.numberFormat;
    this.precision = defaults.precision;
    this.theme = defaults.theme;
    this.language = defaults.language;
    this.maxHistoryItems = defaults.maxHistoryItems;
    this.autoSave = defaults.autoSave;
    this.vibrationEnabled = defaults.vibrationEnabled;
    this.soundEnabled = defaults.soundEnabled;
    this.updatedAt = new Date();
  }

  /**
   * 获取本地化的设置显示名称
   */
  public getDisplayNames(): Record<string, string> {
    const localeStrings = {
      'zh-CN': {
        angleUnit: '角度单位',
        numberFormat: '数字格式',
        precision: '精度',
        theme: '主题',
        language: '语言',
        maxHistoryItems: '最大历史记录数',
        autoSave: '自动保存',
        vibrationEnabled: '振动反馈',
        soundEnabled: '声音效果',
      },
      'en-US': {
        angleUnit: 'Angle Unit',
        numberFormat: 'Number Format',
        precision: 'Precision',
        theme: 'Theme',
        language: 'Language',
        maxHistoryItems: 'Max History Items',
        autoSave: 'Auto Save',
        vibrationEnabled: 'Vibration',
        soundEnabled: 'Sound Effects',
      },
    };

    return localeStrings[this.language as keyof typeof localeStrings] || localeStrings['zh-CN'];
  }

  /**
   * 获取设置值的本地化显示
   */
  public getValueDisplayName(key: keyof Settings, value: any): string {
    const localeStrings = {
      'zh-CN': {
        angleUnit: {
          [AngleUnit.DEGREE]: '角度',
          [AngleUnit.RADIAN]: '弧度',
          [AngleUnit.GRADIAN]: '百分度',
        },
        numberFormat: {
          [NumberFormat.AUTOMATIC]: '自动',
          [NumberFormat.DECIMAL]: '十进制',
          [NumberFormat.SCIENTIFIC]: '科学计数法',
          [NumberFormat.ENGINEERING]: '工程记数法',
        },
        theme: {
          [Theme.LIGHT]: '浅色',
          [Theme.DARK]: '深色',
          [Theme.AUTO]: '跟随系统',
        },
        boolean: {
          true: '开启',
          false: '关闭',
        },
      },
      'en-US': {
        angleUnit: {
          [AngleUnit.DEGREE]: 'Degrees',
          [AngleUnit.RADIAN]: 'Radians',
          [AngleUnit.GRADIAN]: 'Gradians',
        },
        numberFormat: {
          [NumberFormat.AUTOMATIC]: 'Automatic',
          [NumberFormat.DECIMAL]: 'Decimal',
          [NumberFormat.SCIENTIFIC]: 'Scientific',
          [NumberFormat.ENGINEERING]: 'Engineering',
        },
        theme: {
          [Theme.LIGHT]: 'Light',
          [Theme.DARK]: 'Dark',
          [Theme.AUTO]: 'Auto',
        },
        boolean: {
          true: 'On',
          false: 'Off',
        },
      },
    };

    const locale = this.language as keyof typeof localeStrings;
    const strings = localeStrings[locale] || localeStrings['zh-CN'];

    if (key === 'angleUnit' || key === 'numberFormat' || key === 'theme') {
      return (strings as any)[key][value] || value;
    }

    if (typeof value === 'boolean') {
      return strings.boolean[value.toString() as 'true' | 'false'];
    }

    return value.toString();
  }

  /**
   * 获取设置的分组信息
   */
  public getSettingsGroups(): Array<{
    title: string;
    description: string;
    items: Array<{
      key: keyof Settings;
      type: 'select' | 'number' | 'boolean' | 'text';
      options?: Array<{ value: any; label: string }>;
      min?: number;
      max?: number;
      step?: number;
    }>;
  }> {
    const displayNames = this.getDisplayNames();

    return [
      {
        title: '计算设置',
        description: '计算和显示相关的设置',
        items: [
          {
            key: 'angleUnit',
            type: 'select',
            options: Object.values(AngleUnit).map(unit => ({
              value: unit,
              label: this.getValueDisplayName('angleUnit', unit),
            })),
          },
          {
            key: 'numberFormat',
            type: 'select',
            options: Object.values(NumberFormat).map(format => ({
              value: format,
              label: this.getValueDisplayName('numberFormat', format),
            })),
          },
          {
            key: 'precision',
            type: 'number',
            min: SettingsModel.VALIDATION.precision.min,
            max: SettingsModel.VALIDATION.precision.max,
            step: 1,
          },
        ],
      },
      {
        title: '界面设置',
        description: '应用外观和行为设置',
        items: [
          {
            key: 'theme',
            type: 'select',
            options: Object.values(Theme).map(theme => ({
              value: theme,
              label: this.getValueDisplayName('theme', theme),
            })),
          },
          {
            key: 'language',
            type: 'select',
            options: SettingsModel.VALIDATION.supportedLanguages.map(lang => ({
              value: lang,
              label: this.getLanguageDisplayName(lang),
            })),
          },
        ],
      },
      {
        title: '数据设置',
        description: '数据存储和历史记录设置',
        items: [
          {
            key: 'maxHistoryItems',
            type: 'number',
            min: SettingsModel.VALIDATION.maxHistoryItems.min,
            max: SettingsModel.VALIDATION.maxHistoryItems.max,
            step: 100,
          },
          {
            key: 'autoSave',
            type: 'boolean',
          },
        ],
      },
      {
        title: '反馈设置',
        description: '触觉和声音反馈设置',
        items: [
          {
            key: 'vibrationEnabled',
            type: 'boolean',
          },
          {
            key: 'soundEnabled',
            type: 'boolean',
          },
        ],
      },
    ];
  }

  /**
   * 获取语言显示名称
   */
  private getLanguageDisplayName(languageCode: string): string {
    const languageNames: Record<string, string> = {
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'ja-JP': '日本語',
      'ko-KR': '한국어',
      'fr-FR': 'Français',
      'de-DE': 'Deutsch',
      'es-ES': 'Español',
      'pt-BR': 'Português (Brasil)',
      'ru-RU': 'Русский',
      'ar-SA': 'العربية',
    };

    return languageNames[languageCode] || languageCode;
  }

  /**
   * 创建设置备份
   */
  public createBackup(): SettingsBackup {
    const data = JSON.stringify(this.toJSON());
    const checksum = this.generateChecksum(data);

    return {
      version: '1.0.0',
      timestamp: new Date(),
      settings: this.toJSON(),
      checksum,
    };
  }

  /**
   * 从备份恢复设置
   */
  public static restoreFromBackup(backup: SettingsBackup): SettingsModel {
    // 验证备份数据完整性
    const data = JSON.stringify(backup.settings);
    const expectedChecksum = SettingsModel.prototype.generateChecksum(data);

    if (backup.checksum !== expectedChecksum) {
      throw new Error('备份数据已损坏，校验和不匹配');
    }

    return SettingsModel.fromJSON(backup.settings);
  }

  /**
   * 生成数据校验和
   */
  private generateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 获取性能优化建议
   */
  public getPerformanceRecommendations(): Array<{
    type: 'warning' | 'info' | 'suggestion';
    message: string;
    action?: () => void;
  }> {
    const recommendations = [];

    if (this.precision > 15) {
      recommendations.push({
        type: 'warning' as const,
        message: '高精度设置可能会影响计算性能，建议设置为15以下',
        action: () => this.update({ precision: 15 }),
      });
    }

    if (this.maxHistoryItems > 5000) {
      recommendations.push({
        type: 'warning' as const,
        message: '历史记录数量过多可能会影响应用启动速度',
        action: () => this.update({ maxHistoryItems: 1000 }),
      });
    }

    if (!this.autoSave) {
      recommendations.push({
        type: 'info' as const,
        message: '建议开启自动保存以防止数据丢失',
        action: () => this.update({ autoSave: true }),
      });
    }

    return recommendations;
  }

  /**
   * 克隆设置对象
   */
  public clone(): SettingsModel {
    return new SettingsModel(this.toJSON());
  }

  /**
   * 序列化为JSON
   */
  public toJSON(): Settings {
    return {
      id: this.id,
      angleUnit: this.angleUnit,
      numberFormat: this.numberFormat,
      precision: this.precision,
      theme: this.theme,
      language: this.language,
      maxHistoryItems: this.maxHistoryItems,
      autoSave: this.autoSave,
      vibrationEnabled: this.vibrationEnabled,
      soundEnabled: this.soundEnabled,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 从JSON反序列化
   */
  public static fromJSON(data: Settings): SettingsModel {
    return new SettingsModel({
      ...data,
      updatedAt: new Date(data.updatedAt),
    });
  }

  /**
   * 获取默认设置实例
   */
  public static createDefault(): SettingsModel {
    return new SettingsModel();
  }

  /**
   * 获取验证规则
   */
  public static getValidationRules(): SettingsValidation {
    return { ...SettingsModel.VALIDATION };
  }

  /**
   * 获取默认值
   */
  public static getDefaults(): SettingsDefaults {
    return { ...SettingsModel.DEFAULTS };
  }
}