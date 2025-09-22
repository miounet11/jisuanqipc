/**
 * Basic Calculator Module
 *
 * 基础计算器模块，支持基本的四则运算和简单函数
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Vibration,
  Animated,
} from 'react-native';
import { Decimal } from 'decimal.js';

import { CalculatorService } from '@/services/CalculatorService';
import { StorageService } from '@/services/StorageService';
import { HistoryModel } from '@/models/History';
import { ValidationUtils } from '@/utils/validation';
import { MathUtils } from '@/utils/math';
import {
  Expression,
  Result,
  CalculatorType,
  ExpressionType,
  History,
  Settings,
} from '@/types';

// 按钮类型定义
type ButtonType = 'number' | 'operator' | 'function' | 'control' | 'equals';

interface Button {
  id: string;
  label: string;
  value: string;
  type: ButtonType;
  style?: 'primary' | 'secondary' | 'accent' | 'danger';
  colspan?: number;
  disabled?: boolean;
}

// 计算器状态
interface CalculatorState {
  display: string;
  expression: string;
  lastResult: string;
  history: History[];
  isError: boolean;
  isCalculating: boolean;
  memoryValue: string;
  isDegreeMode: boolean;
}

// 主键布局
const BUTTON_LAYOUT: Button[][] = [
  [
    { id: 'clear', label: 'C', value: 'clear', type: 'control', style: 'danger' },
    { id: 'clearEntry', label: 'CE', value: 'clearEntry', type: 'control', style: 'secondary' },
    { id: 'backspace', label: '⌫', value: 'backspace', type: 'control', style: 'secondary' },
    { id: 'divide', label: '÷', value: '/', type: 'operator', style: 'accent' },
  ],
  [
    { id: '7', label: '7', value: '7', type: 'number' },
    { id: '8', label: '8', value: '8', type: 'number' },
    { id: '9', label: '9', value: '9', type: 'number' },
    { id: 'multiply', label: '×', value: '*', type: 'operator', style: 'accent' },
  ],
  [
    { id: '4', label: '4', value: '4', type: 'number' },
    { id: '5', label: '5', value: '5', type: 'number' },
    { id: '6', label: '6', value: '6', type: 'number' },
    { id: 'subtract', label: '−', value: '-', type: 'operator', style: 'accent' },
  ],
  [
    { id: '1', label: '1', value: '1', type: 'number' },
    { id: '2', label: '2', value: '2', type: 'number' },
    { id: '3', label: '3', value: '3', type: 'number' },
    { id: 'add', label: '+', value: '+', type: 'operator', style: 'accent' },
  ],
  [
    { id: 'plusMinus', label: '±', value: 'plusMinus', type: 'function', style: 'secondary' },
    { id: '0', label: '0', value: '0', type: 'number' },
    { id: 'decimal', label: '.', value: '.', type: 'number' },
    { id: 'equals', label: '=', value: '=', type: 'equals', style: 'primary' },
  ],
];

// 扩展功能按钮
const EXTENDED_BUTTONS: Button[] = [
  { id: 'sqrt', label: '√', value: 'sqrt', type: 'function', style: 'secondary' },
  { id: 'square', label: 'x²', value: '^2', type: 'function', style: 'secondary' },
  { id: 'percent', label: '%', value: '%', type: 'function', style: 'secondary' },
  { id: 'reciprocal', label: '1/x', value: 'reciprocal', type: 'function', style: 'secondary' },
  { id: 'memoryStore', label: 'MS', value: 'memoryStore', type: 'control', style: 'secondary' },
  { id: 'memoryRecall', label: 'MR', value: 'memoryRecall', type: 'control', style: 'secondary' },
  { id: 'memoryClear', label: 'MC', value: 'memoryClear', type: 'control', style: 'secondary' },
  { id: 'memoryAdd', label: 'M+', value: 'memoryAdd', type: 'control', style: 'secondary' },
];

export const BasicCalculator: React.FC = () => {
  // 状态管理
  const [state, setState] = useState<CalculatorState>({
    display: '0',
    expression: '',
    lastResult: '0',
    history: [],
    isError: false,
    isCalculating: false,
    memoryValue: '0',
    isDegreeMode: true,
  });

  // 服务实例
  const calculatorService = useRef(new CalculatorService()).current;
  const storageService = useRef(new StorageService()).current;

  // 动画值
  const displayScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonPressAnim = useRef(new Animated.Value(1)).current;

  // 设置和历史记录加载
  useEffect(() => {
    loadSettings();
    loadHistory();
  }, []);

  /**
   * 加载设置
   */
  const loadSettings = useCallback(async () => {
    try {
      const settings = await storageService.getSettings();
      setState(prev => ({
        ...prev,
        isDegreeMode: settings.angleUnit === 'degree',
      }));
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  }, [storageService]);

  /**
   * 加载历史记录
   */
  const loadHistory = useCallback(async () => {
    try {
      const history = await storageService.getHistoryList({
        calculatorType: [CalculatorType.BASIC],
        limit: 50,
        orderBy: 'timestamp',
        order: 'desc',
      });
      setState(prev => ({ ...prev, history }));
    } catch (error) {
      console.warn('Failed to load history:', error);
    }
  }, [storageService]);

  /**
   * 按钮动画效果
   */
  const animateButtonPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(buttonPressAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonPressAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonPressAnim]);

  /**
   * 显示屏动画效果
   */
  const animateDisplayUpdate = useCallback(() => {
    Animated.sequence([
      Animated.timing(displayScaleAnim, {
        toValue: 1.02,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(displayScaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [displayScaleAnim]);

  /**
   * 处理按钮点击
   */
  const handleButtonPress = useCallback(async (button: Button) => {
    // 触觉反馈
    Vibration.vibrate(50);
    animateButtonPress();

    if (state.isCalculating) return;

    setState(prev => ({ ...prev, isError: false }));

    try {
      switch (button.type) {
        case 'number':
          handleNumberInput(button.value);
          break;
        case 'operator':
          handleOperatorInput(button.value);
          break;
        case 'function':
          await handleFunctionInput(button.value);
          break;
        case 'control':
          handleControlInput(button.value);
          break;
        case 'equals':
          await handleEqualsInput();
          break;
      }
    } catch (error) {
      console.error('Calculator error:', error);
      showError(error instanceof Error ? error.message : '计算错误');
    }
  }, [state.isCalculating, animateButtonPress]);

  /**
   * 处理数字输入
   */
  const handleNumberInput = useCallback((value: string) => {
    setState(prev => {
      let newDisplay = prev.display;
      let newExpression = prev.expression;

      if (prev.display === '0' || prev.isError) {
        newDisplay = value;
        newExpression = value;
      } else {
        newDisplay = prev.display + value;
        newExpression = prev.expression + value;
      }

      return {
        ...prev,
        display: newDisplay,
        expression: newExpression,
        isError: false,
      };
    });
    animateDisplayUpdate();
  }, [animateDisplayUpdate]);

  /**
   * 处理运算符输入
   */
  const handleOperatorInput = useCallback((operator: string) => {
    setState(prev => {
      const lastChar = prev.expression.slice(-1);
      let newExpression = prev.expression;

      // 如果上一个字符是运算符，替换它
      if (['+', '-', '*', '/'].includes(lastChar)) {
        newExpression = prev.expression.slice(0, -1) + operator;
      } else {
        newExpression = prev.expression + operator;
      }

      return {
        ...prev,
        expression: newExpression,
        display: prev.display + operator,
      };
    });
  }, []);

  /**
   * 处理函数输入
   */
  const handleFunctionInput = useCallback(async (functionName: string) => {
    setState(prev => ({ ...prev, isCalculating: true }));

    try {
      const currentValue = new Decimal(state.display || '0');
      let result: Decimal;

      switch (functionName) {
        case 'sqrt':
          if (currentValue.lt(0)) {
            throw new Error('不能计算负数的平方根');
          }
          result = currentValue.sqrt();
          break;

        case '^2':
          result = currentValue.pow(2);
          break;

        case 'reciprocal':
          if (currentValue.isZero()) {
            throw new Error('不能计算零的倒数');
          }
          result = new Decimal(1).dividedBy(currentValue);
          break;

        case 'plusMinus':
          result = currentValue.negated();
          break;

        case '%':
          result = currentValue.dividedBy(100);
          break;

        default:
          throw new Error(`不支持的函数: ${functionName}`);
      }

      const formattedResult = formatDisplayValue(result);

      setState(prev => ({
        ...prev,
        display: formattedResult,
        expression: formattedResult,
        lastResult: formattedResult,
        isCalculating: false,
      }));

      animateDisplayUpdate();
    } catch (error) {
      setState(prev => ({ ...prev, isCalculating: false }));
      throw error;
    }
  }, [state.display, animateDisplayUpdate]);

  /**
   * 处理控制输入
   */
  const handleControlInput = useCallback((control: string) => {
    switch (control) {
      case 'clear':
        setState(prev => ({
          ...prev,
          display: '0',
          expression: '',
          isError: false,
        }));
        break;

      case 'clearEntry':
        setState(prev => ({
          ...prev,
          display: '0',
        }));
        break;

      case 'backspace':
        setState(prev => {
          let newDisplay = prev.display.slice(0, -1);
          let newExpression = prev.expression.slice(0, -1);

          if (newDisplay === '' || newDisplay === '-') {
            newDisplay = '0';
            newExpression = '';
          }

          return {
            ...prev,
            display: newDisplay,
            expression: newExpression,
          };
        });
        break;

      case 'memoryStore':
        setState(prev => ({ ...prev, memoryValue: prev.display }));
        break;

      case 'memoryRecall':
        setState(prev => ({
          ...prev,
          display: prev.memoryValue,
          expression: prev.memoryValue,
        }));
        break;

      case 'memoryClear':
        setState(prev => ({ ...prev, memoryValue: '0' }));
        break;

      case 'memoryAdd':
        setState(prev => {
          const currentMemory = new Decimal(prev.memoryValue || '0');
          const currentDisplay = new Decimal(prev.display || '0');
          const newMemory = currentMemory.plus(currentDisplay);
          return { ...prev, memoryValue: newMemory.toString() };
        });
        break;
    }
    animateDisplayUpdate();
  }, [animateDisplayUpdate]);

  /**
   * 处理等号输入
   */
  const handleEqualsInput = useCallback(async () => {
    if (!state.expression || state.expression.trim() === '') return;

    setState(prev => ({ ...prev, isCalculating: true }));

    try {
      // 验证表达式
      const validation = ValidationUtils.validateExpression(
        state.expression,
        CalculatorType.BASIC
      );

      if (!validation.isValid) {
        throw new Error(validation.errors[0] || '表达式无效');
      }

      // 解析和计算表达式
      const expression = await calculatorService.parseExpression(
        state.expression,
        CalculatorType.BASIC
      );

      const result = await calculatorService.evaluate(expression);

      if (!result.value) {
        throw new Error('计算结果无效');
      }

      const formattedResult = formatDisplayValue(result.value as Decimal);

      // 保存到历史记录
      await saveToHistory(expression, result);

      setState(prev => ({
        ...prev,
        display: formattedResult,
        expression: formattedResult,
        lastResult: formattedResult,
        isCalculating: false,
      }));

      animateDisplayUpdate();
    } catch (error) {
      setState(prev => ({ ...prev, isCalculating: false }));
      showError(error instanceof Error ? error.message : '计算错误');
    }
  }, [state.expression, calculatorService, animateDisplayUpdate]);

  /**
   * 保存到历史记录
   */
  const saveToHistory = useCallback(async (expression: Expression, result: Result) => {
    try {
      // 保存表达式和结果
      await storageService.saveExpression(expression);
      await storageService.saveResult(result);

      // 创建历史记录
      const history = new HistoryModel(
        expression.id,
        result.id,
        CalculatorType.BASIC,
        {
          notes: `${expression.input} = ${result.displayValue}`,
        }
      );

      await storageService.saveHistory(history.toJSON());

      // 更新本地历史记录
      setState(prev => ({
        ...prev,
        history: [history.toJSON(), ...prev.history.slice(0, 49)],
      }));
    } catch (error) {
      console.warn('Failed to save to history:', error);
    }
  }, [storageService]);

  /**
   * 格式化显示值
   */
  const formatDisplayValue = useCallback((value: Decimal): string => {
    if (value.isNaN() || !value.isFinite()) {
      throw new Error('无效的计算结果');
    }

    // 处理大数字
    if (value.abs().gte(1e15)) {
      return value.toExponential(6);
    }

    // 处理小数字
    if (value.abs().lt(1e-10) && !value.isZero()) {
      return value.toExponential(6);
    }

    // 标准格式
    const str = value.toFixed(10);
    const trimmed = str.replace(/\.?0+$/, '');

    return trimmed === '' ? '0' : trimmed;
  }, []);

  /**
   * 显示错误
   */
  const showError = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      display: 'Error',
      isError: true,
      isCalculating: false,
    }));

    Alert.alert('计算错误', message, [
      {
        text: '确定',
        onPress: () => {
          setState(prev => ({
            ...prev,
            display: '0',
            expression: '',
            isError: false,
          }));
        },
      },
    ]);
  }, []);

  /**
   * 渲染按钮
   */
  const renderButton = useCallback((button: Button) => {
    const buttonStyle = [
      styles.button,
      styles[`button_${button.style || 'default'}`],
      button.colspan ? { flex: button.colspan } : {},
      button.disabled ? styles.buttonDisabled : {},
    ];

    const textStyle = [
      styles.buttonText,
      styles[`buttonText_${button.style || 'default'}`],
      button.disabled ? styles.buttonTextDisabled : {},
    ];

    return (
      <Animated.View
        key={button.id}
        style={[{ transform: [{ scale: buttonPressAnim }] }]}
      >
        <Pressable
          style={({ pressed }) => [
            ...buttonStyle,
            pressed ? styles.buttonPressed : {},
          ]}
          onPress={() => handleButtonPress(button)}
          disabled={button.disabled || state.isCalculating}
        >
          <Text style={textStyle}>{button.label}</Text>
        </Pressable>
      </Animated.View>
    );
  }, [buttonPressAnim, handleButtonPress, state.isCalculating]);

  /**
   * 渲染历史记录项
   */
  const renderHistoryItem = useCallback((item: History, index: number) => (
    <Pressable
      key={item.id}
      style={styles.historyItem}
      onPress={() => {
        setState(prev => ({
          ...prev,
          display: item.notes?.split(' = ')[1] || '0',
          expression: item.notes?.split(' = ')[1] || '',
        }));
      }}
    >
      <Text style={styles.historyText} numberOfLines={1}>
        {item.notes}
      </Text>
      <Text style={styles.historyTime}>
        {new Date(item.timestamp).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </Pressable>
  ), []);

  return (
    <View style={styles.container}>
      {/* 显示屏 */}
      <View style={styles.displayContainer}>
        <Animated.View style={[{ transform: [{ scale: displayScaleAnim }] }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.displayScrollContent}
          >
            <Text
              style={[
                styles.displayText,
                state.isError ? styles.displayTextError : {},
              ]}
              numberOfLines={1}
            >
              {state.display}
            </Text>
          </ScrollView>
        </Animated.View>

        {/* 表达式预览 */}
        {state.expression && state.expression !== state.display && (
          <Text style={styles.expressionText} numberOfLines={1}>
            {state.expression}
          </Text>
        )}

        {/* 内存指示器 */}
        {state.memoryValue !== '0' && (
          <View style={styles.memoryIndicator}>
            <Text style={styles.memoryText}>M</Text>
          </View>
        )}
      </View>

      {/* 扩展功能按钮 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.extendedButtonsContainer}
        contentContainerStyle={styles.extendedButtonsContent}
      >
        {EXTENDED_BUTTONS.map(renderButton)}
      </ScrollView>

      {/* 主键盘 */}
      <View style={styles.keypadContainer}>
        {BUTTON_LAYOUT.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.buttonRow}>
            {row.map(renderButton)}
          </View>
        ))}
      </View>

      {/* 历史记录 */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>历史记录</Text>
        <ScrollView style={styles.historyList}>
          {state.history.slice(0, 5).map(renderHistoryItem)}
        </ScrollView>
      </View>

      {/* 加载指示器 */}
      {state.isCalculating && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>计算中...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },

  displayContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },

  displayScrollContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: '100%',
  },

  displayText: {
    fontSize: 36,
    fontWeight: '300',
    color: '#333',
    textAlign: 'right',
    fontFamily: 'monospace',
  },

  displayTextError: {
    color: '#ff4444',
  },

  expressionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
    fontFamily: 'monospace',
  },

  memoryIndicator: {
    position: 'absolute',
    top: 10,
    left: 20,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  memoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  extendedButtonsContainer: {
    marginBottom: 16,
  },

  extendedButtonsContent: {
    paddingHorizontal: 8,
  },

  keypadContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },

  buttonRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  button: {
    flex: 1,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  button_default: {
    backgroundColor: '#f8f9fa',
  },

  button_primary: {
    backgroundColor: '#007AFF',
  },

  button_secondary: {
    backgroundColor: '#6c757d',
  },

  button_accent: {
    backgroundColor: '#ff9500',
  },

  button_danger: {
    backgroundColor: '#ff3b30',
  },

  buttonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    fontSize: 20,
    fontWeight: '500',
  },

  buttonText_default: {
    color: '#333',
  },

  buttonText_primary: {
    color: '#ffffff',
  },

  buttonText_secondary: {
    color: '#ffffff',
  },

  buttonText_accent: {
    color: '#ffffff',
  },

  buttonText_danger: {
    color: '#ffffff',
  },

  buttonTextDisabled: {
    color: '#999',
  },

  historyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  historyList: {
    flex: 1,
  },

  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: '#f8f9fa',
  },

  historyText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },

  historyTime: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default BasicCalculator;