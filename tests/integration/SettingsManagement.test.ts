/**
 * Settings Management Integration Test
 *
 * 设置管理集成测试
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '@/services/StorageService';
import { CalculatorService } from '@/services/CalculatorService';
import { Settings } from '@/models/Settings';

describe('Settings Management Integration', () => {
  let storageService: StorageService;
  let calculatorService: CalculatorService;

  beforeAll(async () => {
    storageService = new StorageService();
    calculatorService = new CalculatorService();
    await storageService.initialize();
  });

  beforeEach(async () => {
    await AsyncStorage.clear();
    await storageService.initialize();
  });

  afterAll(async () => {
    await AsyncStorage.clear();
  });

  describe('Theme Settings', () => {
    test('should apply theme settings correctly', async () => {
      const settings: Partial<Settings> = {
        theme: 'dark',
      };

      await storageService.saveSettings(settings as Settings);
      const savedSettings = await storageService.getSettings();

      expect(savedSettings?.theme).toBe('dark');
    });

    test('should handle auto theme detection', async () => {
      const settings: Partial<Settings> = {
        theme: 'auto',
      };

      await storageService.saveSettings(settings as Settings);
      const savedSettings = await storageService.getSettings();

      expect(savedSettings?.theme).toBe('auto');
    });

    test('should validate theme values', async () => {
      const invalidSettings = {
        theme: 'invalid_theme',
      } as any;

      await expect(storageService.saveSettings(invalidSettings)).rejects.toThrow();
    });
  });

  describe('Scientific Calculator Settings', () => {
    test('should toggle scientific mode', async () => {
      // 启用科学模式
      await storageService.updateSettings({ scientificMode: true });
      let settings = await storageService.getSettings();
      expect(settings?.scientificMode).toBe(true);

      // 禁用科学模式
      await storageService.updateSettings({ scientificMode: false });
      settings = await storageService.getSettings();
      expect(settings?.scientificMode).toBe(false);
    });

    test('should change angle unit settings', async () => {
      // 设置为弧度
      await storageService.updateSettings({ angleUnit: 'radian' });
      await calculatorService.applySettings();

      let settings = await storageService.getSettings();
      expect(settings?.angleUnit).toBe('radian');

      // 验证计算器使用弧度模式
      const sinResult = await calculatorService.calculateFunction('sin', Math.PI / 2);
      expect(parseFloat(sinResult)).toBeCloseTo(1, 6);

      // 设置为度数
      await storageService.updateSettings({ angleUnit: 'degree' });
      await calculatorService.applySettings();

      settings = await storageService.getSettings();
      expect(settings?.angleUnit).toBe('degree');

      // 验证计算器使用度数模式
      const sin90Result = await calculatorService.calculateFunction('sin', 90);
      expect(parseFloat(sin90Result)).toBeCloseTo(1, 6);
    });

    test('should validate angle unit values', async () => {
      const invalidSettings = {
        angleUnit: 'invalid_unit',
      } as any;

      await expect(storageService.updateSettings(invalidSettings)).rejects.toThrow();
    });
  });

  describe('Display Settings', () => {
    test('should change decimal places setting', async () => {
      await storageService.updateSettings({ decimalPlaces: 4 });
      const settings = await storageService.getSettings();

      expect(settings?.decimalPlaces).toBe(4);

      // 验证计算结果格式
      const result = await calculatorService.formatResult('3.141592653589793');
      expect(result).toMatch(/3\.1416/); // 4位小数
    });

    test('should toggle thousands separator', async () => {
      // 启用千位分隔符
      await storageService.updateSettings({ thousandsSeparator: true });
      await calculatorService.applySettings();

      let settings = await storageService.getSettings();
      expect(settings?.thousandsSeparator).toBe(true);

      // 验证大数字格式化
      const result = await calculatorService.formatResult('1234567.89');
      expect(result).toMatch(/1,234,567\.89/);

      // 禁用千位分隔符
      await storageService.updateSettings({ thousandsSeparator: false });
      await calculatorService.applySettings();

      settings = await storageService.getSettings();
      expect(settings?.thousandsSeparator).toBe(false);

      const result2 = await calculatorService.formatResult('1234567.89');
      expect(result2).toBe('1234567.89');
    });

    test('should validate decimal places range', async () => {
      // 测试有效范围
      await storageService.updateSettings({ decimalPlaces: 0 });
      let settings = await storageService.getSettings();
      expect(settings?.decimalPlaces).toBe(0);

      await storageService.updateSettings({ decimalPlaces: 15 });
      settings = await storageService.getSettings();
      expect(settings?.decimalPlaces).toBe(15);

      // 测试无效值
      await expect(storageService.updateSettings({ decimalPlaces: -1 })).rejects.toThrow();
      await expect(storageService.updateSettings({ decimalPlaces: 20 })).rejects.toThrow();
    });

    test('should change font size setting', async () => {
      const fontSizes = ['small', 'medium', 'large'] as const;

      for (const fontSize of fontSizes) {
        await storageService.updateSettings({ fontSize });
        const settings = await storageService.getSettings();
        expect(settings?.fontSize).toBe(fontSize);
      }
    });
  });

  describe('User Interface Settings', () => {
    test('should toggle vibration setting', async () => {
      // 启用震动
      await storageService.updateSettings({ vibrationEnabled: true });
      let settings = await storageService.getSettings();
      expect(settings?.vibrationEnabled).toBe(true);

      // 禁用震动
      await storageService.updateSettings({ vibrationEnabled: false });
      settings = await storageService.getSettings();
      expect(settings?.vibrationEnabled).toBe(false);
    });

    test('should toggle sound setting', async () => {
      // 启用声音
      await storageService.updateSettings({ soundEnabled: true });
      let settings = await storageService.getSettings();
      expect(settings?.soundEnabled).toBe(true);

      // 禁用声音
      await storageService.updateSettings({ soundEnabled: false });
      settings = await storageService.getSettings();
      expect(settings?.soundEnabled).toBe(false);
    });

    test('should change button style setting', async () => {
      const buttonStyles = ['rounded', 'square'] as const;

      for (const buttonStyle of buttonStyles) {
        await storageService.updateSettings({ buttonStyle });
        const settings = await storageService.getSettings();
        expect(settings?.buttonStyle).toBe(buttonStyle);
      }
    });
  });

  describe('History Settings', () => {
    test('should toggle history functionality', async () => {
      // 启用历史记录
      await storageService.updateSettings({ historyEnabled: true });
      let settings = await storageService.getSettings();
      expect(settings?.historyEnabled).toBe(true);

      // 添加历史记录应该成功
      await storageService.addToHistory('2 + 2', '4');
      let history = await storageService.getHistory();
      expect(history.length).toBeGreaterThan(0);

      // 禁用历史记录
      await storageService.updateSettings({ historyEnabled: false });
      settings = await storageService.getSettings();
      expect(settings?.historyEnabled).toBe(false);

      // 清除现有历史记录
      await storageService.clearHistory();
      history = await storageService.getHistory();
      expect(history.length).toBe(0);
    });

    test('should change max history items setting', async () => {
      const maxItems = 25;
      await storageService.updateSettings({ maxHistoryItems: maxItems });
      await storageService.setMaxHistorySize(maxItems);

      // 添加超过限制的历史记录
      for (let i = 1; i <= 50; i++) {
        await storageService.addToHistory(`${i} + 1`, (i + 1).toString());
      }

      const history = await storageService.getHistory();
      expect(history.length).toBeLessThanOrEqual(maxItems);
    });

    test('should validate max history items range', async () => {
      // 测试有效范围
      await storageService.updateSettings({ maxHistoryItems: 10 });
      let settings = await storageService.getSettings();
      expect(settings?.maxHistoryItems).toBe(10);

      await storageService.updateSettings({ maxHistoryItems: 1000 });
      settings = await storageService.getSettings();
      expect(settings?.maxHistoryItems).toBe(1000);

      // 测试无效值
      await expect(storageService.updateSettings({ maxHistoryItems: 0 })).rejects.toThrow();
      await expect(storageService.updateSettings({ maxHistoryItems: -1 })).rejects.toThrow();
    });
  });

  describe('Calculation Settings', () => {
    test('should change precision setting', async () => {
      const precisionLevels = ['standard', 'high'] as const;

      for (const precision of precisionLevels) {
        await storageService.updateSettings({ precision });
        await calculatorService.applySettings();

        const settings = await storageService.getSettings();
        expect(settings?.precision).toBe(precision);

        // 验证精度设置影响计算
        const result = await calculatorService.calculatePreciseOperation('1/3');
        if (precision === 'high') {
          expect(result.length).toBeGreaterThan(10); // 高精度应该有更多位数
        }
      }
    });

    test('should toggle auto-save setting', async () => {
      // 启用自动保存
      await storageService.updateSettings({ autoSave: true });
      let settings = await storageService.getSettings();
      expect(settings?.autoSave).toBe(true);

      // 禁用自动保存
      await storageService.updateSettings({ autoSave: false });
      settings = await storageService.getSettings();
      expect(settings?.autoSave).toBe(false);
    });
  });

  describe('Settings Synchronization', () => {
    test('should apply all settings to calculator service', async () => {
      const testSettings: Partial<Settings> = {
        scientificMode: true,
        angleUnit: 'radian',
        decimalPlaces: 6,
        thousandsSeparator: true,
        precision: 'high',
      };

      await storageService.updateSettings(testSettings);
      await calculatorService.applySettings();

      // 验证设置已应用到计算器服务
      const currentSettings = await calculatorService.getCurrentSettings();
      expect(currentSettings.scientificMode).toBe(true);
      expect(currentSettings.angleUnit).toBe('radian');
      expect(currentSettings.decimalPlaces).toBe(6);
    });

    test('should handle settings changes during calculations', async () => {
      // 开始一个计算
      const expression = '2 * 3.14159';
      const result1 = await calculatorService.calculate({ expression } as any);

      // 在计算过程中更改设置
      await storageService.updateSettings({ decimalPlaces: 2 });
      await calculatorService.applySettings();

      // 下一个计算应该使用新设置
      const result2 = await calculatorService.calculate({ expression } as any);

      expect(result1.value).not.toBe(result2.value); // 格式应该不同
    });
  });

  describe('Settings Import/Export', () => {
    test('should export settings correctly', async () => {
      const testSettings: Partial<Settings> = {
        theme: 'dark',
        scientificMode: true,
        angleUnit: 'degree',
        decimalPlaces: 4,
        thousandsSeparator: false,
        vibrationEnabled: true,
        soundEnabled: false,
        fontSize: 'large',
        buttonStyle: 'rounded',
      };

      await storageService.updateSettings(testSettings);

      const exportedData = await storageService.exportSettings();

      expect(exportedData.theme).toBe('dark');
      expect(exportedData.scientificMode).toBe(true);
      expect(exportedData.angleUnit).toBe('degree');
      expect(exportedData.decimalPlaces).toBe(4);
      expect(exportedData.fontSize).toBe('large');
    });

    test('should import settings correctly', async () => {
      const importSettings = {
        theme: 'light',
        scientificMode: false,
        angleUnit: 'radian',
        decimalPlaces: 8,
        thousandsSeparator: true,
        vibrationEnabled: false,
        soundEnabled: true,
        fontSize: 'small',
        buttonStyle: 'square',
      };

      await storageService.importSettings(importSettings);

      const currentSettings = await storageService.getSettings();
      expect(currentSettings?.theme).toBe('light');
      expect(currentSettings?.scientificMode).toBe(false);
      expect(currentSettings?.angleUnit).toBe('radian');
      expect(currentSettings?.decimalPlaces).toBe(8);
      expect(currentSettings?.fontSize).toBe('small');
    });

    test('should validate imported settings', async () => {
      const invalidSettings = {
        theme: 'invalid_theme',
        decimalPlaces: -5,
        angleUnit: 'invalid_unit',
      };

      await expect(storageService.importSettings(invalidSettings as any)).rejects.toThrow();
    });
  });

  describe('Settings Defaults and Reset', () => {
    test('should provide correct default settings', async () => {
      const defaultSettings = await storageService.getDefaultSettings();

      expect(defaultSettings.theme).toBeDefined();
      expect(defaultSettings.scientificMode).toBeDefined();
      expect(defaultSettings.angleUnit).toBeDefined();
      expect(defaultSettings.decimalPlaces).toBeGreaterThan(0);
      expect(defaultSettings.maxHistoryItems).toBeGreaterThan(0);
    });

    test('should reset settings to defaults', async () => {
      // 修改一些设置
      await storageService.updateSettings({
        theme: 'dark',
        scientificMode: true,
        decimalPlaces: 2,
        vibrationEnabled: false,
      });

      let settings = await storageService.getSettings();
      expect(settings?.theme).toBe('dark');
      expect(settings?.scientificMode).toBe(true);

      // 重置到默认值
      await storageService.resetToDefaults();

      settings = await storageService.getSettings();
      const defaults = await storageService.getDefaultSettings();

      expect(settings?.theme).toBe(defaults.theme);
      expect(settings?.scientificMode).toBe(defaults.scientificMode);
      expect(settings?.decimalPlaces).toBe(defaults.decimalPlaces);
      expect(settings?.vibrationEnabled).toBe(defaults.vibrationEnabled);
    });
  });

  describe('Settings Performance', () => {
    test('should load settings quickly', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 50; i++) {
        await storageService.getSettings();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 50次设置加载应该在500ms内完成
      expect(duration).toBeLessThan(500);
    });

    test('should save settings quickly', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 20; i++) {
        await storageService.updateSettings({
          decimalPlaces: (i % 10) + 1,
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 20次设置保存应该在1秒内完成
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Settings Error Handling', () => {
    test('should handle corrupted settings gracefully', async () => {
      // 写入损坏的设置数据
      await AsyncStorage.setItem('calculator_settings', 'invalid json data');

      // 重新初始化应该使用默认设置
      await storageService.initialize();

      const settings = await storageService.getSettings();
      expect(settings).toBeDefined();

      const defaults = await storageService.getDefaultSettings();
      expect(settings?.theme).toBe(defaults.theme);
    });

    test('should handle storage errors gracefully', async () => {
      // 模拟存储错误
      const originalSetItem = AsyncStorage.setItem;
      AsyncStorage.setItem = jest.fn().mockRejectedValue(new Error('Storage error'));

      // 更新设置应该处理错误
      await expect(storageService.updateSettings({ theme: 'dark' })).rejects.toThrow();

      // 恢复原始方法
      AsyncStorage.setItem = originalSetItem;
    });

    test('should validate all setting fields', async () => {
      const invalidSettingTests = [
        { theme: 123 }, // 应该是字符串
        { decimalPlaces: 'invalid' }, // 应该是数字
        { scientificMode: 'yes' }, // 应该是布尔值
        { maxHistoryItems: 0 }, // 应该大于0
        { fontSize: 'huge' }, // 无效的字体大小
      ];

      for (const invalidSetting of invalidSettingTests) {
        await expect(
          storageService.updateSettings(invalidSetting as any)
        ).rejects.toThrow();
      }
    });
  });

  describe('Settings Migration', () => {
    test('should migrate settings from older versions', async () => {
      // 模拟旧版本设置（缺少一些新字段）
      const oldSettings = {
        theme: 'light',
        scientificMode: false,
        // 缺少新字段如 precision, buttonStyle 等
      };

      await AsyncStorage.setItem('calculator_settings', JSON.stringify(oldSettings));

      // 重新初始化应该触发迁移
      await storageService.initialize();

      const settings = await storageService.getSettings();
      expect(settings?.theme).toBe('light');
      expect(settings?.scientificMode).toBe(false);

      // 新字段应该有默认值
      expect(settings?.precision).toBeDefined();
      expect(settings?.buttonStyle).toBeDefined();
      expect(settings?.autoSave).toBeDefined();
    });

    test('should handle version updates correctly', async () => {
      const oldVersionSettings = {
        version: '1.0.0',
        theme: 'dark',
        scientificMode: true,
        // 旧版本字段
        oldField: 'should be removed',
      };

      await AsyncStorage.setItem('calculator_settings', JSON.stringify(oldVersionSettings));

      await storageService.initialize();

      const settings = await storageService.getSettings();
      expect(settings?.theme).toBe('dark');
      expect(settings?.scientificMode).toBe(true);
      expect((settings as any).oldField).toBeUndefined(); // 旧字段应该被移除
    });
  });
});