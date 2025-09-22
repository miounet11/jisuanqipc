/**
 * Scientific Calculator Module
 *
 * 科学计算器模块，支持高级数学函数和科学计算
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
  Switch,
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
  AngleUnit,
} from '@/types';

// 按钮类型定义
type ButtonType = 'number' | 'operator' | 'function' | 'control' | 'equals' | 'constant';

interface ScientificButton {
  id: string;
  label: string;
  value: string;
  type: ButtonType;
  style?: 'primary' | 'secondary' | 'accent' | 'danger' | 'function';
  shift?: boolean; // 是否为shift功能
  shiftLabel?: string; // shift状态下的标签
  shiftValue?: string; // shift状态下的值
  disabled?: boolean;
}

// 科学计算器状态
interface ScientificCalculatorState {
  display: string;
  expression: string;
  lastResult: string;
  history: History[];
  isError: boolean;
  isCalculating: boolean;
  isShiftActive: boolean;
  isDegreeMode: boolean;
  isHyperbolic: boolean;
  memoryValue: string;
  constants: Map<string, number>;
}

// 科学计算器按钮布局
const SCIENTIFIC_BUTTON_LAYOUT: ScientificButton[][] = [
  [
    { id: 'shift', label: 'Shift', value: 'shift', type: 'control', style: 'secondary' },
    { id: 'deg_rad', label: 'Deg', value: 'angleMode', type: 'control', style: 'secondary' },
    { id: 'hyp', label: 'Hyp', value: 'hyperbolic', type: 'control', style: 'secondary' },
    { id: 'clear', label: 'C', value: 'clear', type: 'control', style: 'danger' },
  ],
  [
    {
      id: 'pi',
      label: 'π',
      value: 'π',
      type: 'constant',
      style: 'function',
      shift: true,
      shiftLabel: 'e',
      shiftValue: 'e',
    },
    {
      id: 'sin',
      label: 'sin',
      value: 'sin',
      type: 'function',
      style: 'function',
      shift: true,
      shiftLabel: 'sin⁻¹',
      shiftValue: 'asin',
    },
    {
      id: 'cos',
      label: 'cos',
      value: 'cos',
      type: 'function',
      style: 'function',
      shift: true,
      shiftLabel: 'cos⁻¹',
      shiftValue: 'acos',
    },
    {
      id: 'tan',
      label: 'tan',
      value: 'tan',
      type: 'function',
      style: 'function',
      shift: true,
      shiftLabel: 'tan⁻¹',
      shiftValue: 'atan',
    },
  ],
  [
    {
      id: 'factorial',
      label: 'n!',
      value: 'factorial',
      type: 'function',
      style: 'function',
      shift: true,
      shiftLabel: 'nPr',
      shiftValue: 'permutation',
    },
    {
      id: 'ln',
      label: 'ln',
      value: 'ln',
      type: 'function',
      style: 'function',
      shift: true,
      shiftLabel: 'e^x',
      shiftValue: 'exp',
    },
    {
      id: 'log',
      label: 'log',
      value: 'log',
      type: 'function',
      style: 'function',
      shift: true,
      shiftLabel: '10^x',
      shiftValue: 'pow10',
    },
    {
      id: 'power',
      label: 'x^y',
      value: '^',
      type: 'operator',
      style: 'function',
      shift: true,
      shiftLabel: 'x^(1/y)',
      shiftValue: 'nthRoot',
    },
  ],
  [
    {
      id: 'sqrt',
      label: '√',
      value: 'sqrt',
      type: 'function',
      style: 'function',
      shift: true,
      shiftLabel: 'x²',
      shiftValue: 'square',
    },
    { id: 'leftParen', label: '(', value: '(', type: 'operator', style: 'secondary' },
    { id: 'rightParen', label: ')', value: ')', type: 'operator', style: 'secondary' },
    { id: 'divide', label: '÷', value: '/', type: 'operator', style: 'accent' },
  ],
  [
    {
      id: 'abs',
      label: '|x|',
      value: 'abs',
      type: 'function',
      style: 'function',
      shift: true,
      shiftLabel: 'rand',
      shiftValue: 'random',
    },
    { id: '7', label: '7', value: '7', type: 'number' },
    { id: '8', label: '8', value: '8', type: 'number' },
    { id: '9', label: '9', value: '9', type: 'number' },
  ],
  [
    { id: 'multiply', label: '×', value: '*', type: 'operator', style: 'accent' },
    { id: '4', label: '4', value: '4', type: 'number' },
    { id: '5', label: '5', value: '5', type: 'number' },
    { id: '6', label: '6', value: '6', type: 'number' },
  ],
  [
    { id: 'subtract', label: '−', value: '-', type: 'operator', style: 'accent' },
    { id: '1', label: '1', value: '1', type: 'number' },
    { id: '2', label: '2', value: '2', type: 'number' },
    { id: '3', label: '3', value: '3', type: 'number' },
  ],
  [
    { id: 'add', label: '+', value: '+', type: 'operator', style: 'accent' },
    { id: 'plusMinus', label: '±', value: 'plusMinus', type: 'function', style: 'secondary' },
    { id: '0', label: '0', value: '0', type: 'number' },
    { id: 'decimal', label: '.', value: '.', type: 'number' },
  ],
  [
    { id: 'equals', label: '=', value: '=', type: 'equals', style: 'primary' },
  ],
];

// 内存和常数按钮
const MEMORY_BUTTONS: ScientificButton[] = [
  { id: 'memoryStore', label: 'MS', value: 'memoryStore', type: 'control', style: 'secondary' },
  { id: 'memoryRecall', label: 'MR', value: 'memoryRecall', type: 'control', style: 'secondary' },
  { id: 'memoryClear', label: 'MC', value: 'memoryClear', type: 'control', style: 'secondary' },
  { id: 'memoryAdd', label: 'M+', value: 'memoryAdd', type: 'control', style: 'secondary' },
];

export const ScientificCalculator: React.FC = () => {
  // 状态管理
  const [state, setState] = useState<ScientificCalculatorState>({
    display: '0',
    expression: '',
    lastResult: '0',
    history: [],
    isError: false,
    isCalculating: false,
    isShiftActive: false,
    isDegreeMode: true,
    isHyperbolic: false,
    memoryValue: '0',
    constants: new Map([
      ['π', Math.PI],
      ['e', Math.E],
      ['φ', (1 + Math.sqrt(5)) / 2], // 黄金比例
    ]),
  });

  // 服务实例
  const calculatorService = useRef(new CalculatorService()).current;
  const storageService = useRef(new StorageService()).current;

  // 动画值
  const displayScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonPressAnim = useRef(new Animated.Value(1)).current;
  const shiftIndicatorAnim = useRef(new Animated.Value(0)).current;

  // 初始化
  useEffect(() => {
    loadSettings();
    loadHistory();
  }, []);

  // Shift模式动画
  useEffect(() => {
    Animated.timing(shiftIndicatorAnim, {
      toValue: state.isShiftActive ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [state.isShiftActive, shiftIndicatorAnim]);

  /**
   * 加载设置
   */
  const loadSettings = useCallback(async () => {
    try {
      const settings = await storageService.getSettings();
      setState(prev => ({
        ...prev,
        isDegreeMode: settings.angleUnit === AngleUnit.DEGREE,
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
        calculatorType: [CalculatorType.SCIENTIFIC],
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
  const handleButtonPress = useCallback(async (button: ScientificButton) => {
    // 触觉反馈
    Vibration.vibrate(50);
    animateButtonPress();

    if (state.isCalculating) return;

    setState(prev => ({ ...prev, isError: false }));

    // 获取实际的按钮值（考虑Shift状态）
    const actualValue = state.isShiftActive && button.shiftValue
      ? button.shiftValue
      : button.value;

    const actualLabel = state.isShiftActive && button.shiftLabel
      ? button.shiftLabel
      : button.label;

    try {
      switch (button.type) {
        case 'number':
          handleNumberInput(actualValue);
          break;
        case 'operator':
          handleOperatorInput(actualValue);
          break;
        case 'function':
          await handleFunctionInput(actualValue, actualLabel);
          break;
        case 'constant':
          handleConstantInput(actualValue);
          break;
        case 'control':
          await handleControlInput(actualValue);
          break;
        case 'equals':
          await handleEqualsInput();
          break;
      }

      // 清除Shift状态（除了Shift按钮本身）
      if (button.id !== 'shift' && state.isShiftActive) {
        setState(prev => ({ ...prev, isShiftActive: false }));
      }
    } catch (error) {
      console.error('Scientific calculator error:', error);
      showError(error instanceof Error ? error.message : '计算错误');
    }
  }, [state.isCalculating, state.isShiftActive, animateButtonPress]);

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

      // 处理括号
      if (operator === '(' || operator === ')') {
        newExpression = prev.expression + operator;
        return {
          ...prev,
          expression: newExpression,
          display: prev.display + operator,
        };
      }

      // 如果上一个字符是运算符，替换它
      if (['+', '-', '*', '/', '^'].includes(lastChar)) {
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
  const handleFunctionInput = useCallback(async (functionName: string, label: string) => {
    setState(prev => ({ ...prev, isCalculating: true }));

    try {
      const currentValue = new Decimal(state.display || '0');
      let result: Decimal;

      switch (functionName) {
        case 'sin':
        case 'cos':
        case 'tan':
          const angle = state.isDegreeMode
            ? MathUtils.convertAngle(currentValue.toNumber(), AngleUnit.DEGREE, AngleUnit.RADIAN)
            : currentValue.toNumber();

          if (state.isHyperbolic) {
            switch (functionName) {
              case 'sin': result = new Decimal(Math.sinh(angle)); break;
              case 'cos': result = new Decimal(Math.cosh(angle)); break;
              case 'tan': result = new Decimal(Math.tanh(angle)); break;
            }
          } else {
            switch (functionName) {
              case 'sin': result = new Decimal(Math.sin(angle)); break;
              case 'cos': result = new Decimal(Math.cos(angle)); break;
              case 'tan': result = new Decimal(Math.tan(angle)); break;
            }
          }
          break;

        case 'asin':
        case 'acos':
        case 'atan':
          const value = currentValue.toNumber();
          let radianResult: number;

          if (state.isHyperbolic) {
            switch (functionName) {
              case 'asin': radianResult = Math.asinh(value); break;
              case 'acos': radianResult = Math.acosh(value); break;
              case 'atan': radianResult = Math.atanh(value); break;
              default: radianResult = 0;
            }
          } else {
            switch (functionName) {
              case 'asin': radianResult = Math.asin(value); break;
              case 'acos': radianResult = Math.acos(value); break;
              case 'atan': radianResult = Math.atan(value); break;
              default: radianResult = 0;
            }
          }

          const finalResult = state.isDegreeMode
            ? MathUtils.convertAngle(radianResult, AngleUnit.RADIAN, AngleUnit.DEGREE)
            : radianResult;

          result = new Decimal(finalResult);
          break;

        case 'ln':
          if (currentValue.lte(0)) {
            throw new Error('ln函数的参数必须大于0');
          }
          result = new Decimal(Math.log(currentValue.toNumber()));
          break;

        case 'log':
          if (currentValue.lte(0)) {
            throw new Error('log函数的参数必须大于0');
          }
          result = new Decimal(Math.log10(currentValue.toNumber()));
          break;

        case 'exp':
          result = new Decimal(Math.exp(currentValue.toNumber()));
          break;

        case 'pow10':
          result = new Decimal(Math.pow(10, currentValue.toNumber()));
          break;

        case 'sqrt':
          if (currentValue.lt(0)) {
            throw new Error('不能计算负数的平方根');
          }
          result = currentValue.sqrt();
          break;

        case 'square':
          result = currentValue.pow(2);
          break;

        case 'abs':
          result = currentValue.abs();
          break;

        case 'factorial':
          if (!currentValue.isInteger() || currentValue.lt(0)) {
            throw new Error('阶乘只能计算非负整数');
          }
          result = MathUtils.factorial(currentValue.toNumber());
          break;

        case 'plusMinus':
          result = currentValue.negated();
          break;

        case 'random':
          result = new Decimal(Math.random());
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
  }, [state.display, state.isDegreeMode, state.isHyperbolic, animateDisplayUpdate]);

  /**
   * 处理常数输入
   */
  const handleConstantInput = useCallback((constant: string) => {
    const value = state.constants.get(constant);
    if (value !== undefined) {
      const formattedValue = formatDisplayValue(new Decimal(value));
      setState(prev => ({
        ...prev,
        display: formattedValue,
        expression: formattedValue,
      }));
      animateDisplayUpdate();
    }
  }, [state.constants, animateDisplayUpdate]);

  /**
   * 处理控制输入
   */
  const handleControlInput = useCallback(async (control: string) => {
    switch (control) {
      case 'shift':
        setState(prev => ({ ...prev, isShiftActive: !prev.isShiftActive }));
        break;

      case 'angleMode':
        const newAngleMode = !state.isDegreeMode;
        setState(prev => ({ ...prev, isDegreeMode: newAngleMode }));

        // 保存到设置
        try {
          const settings = await storageService.getSettings();
          settings.angleUnit = newAngleMode ? AngleUnit.DEGREE : AngleUnit.RADIAN;
          await storageService.saveSettings(settings);
        } catch (error) {
          console.warn('Failed to save angle mode:', error);
        }
        break;

      case 'hyperbolic':
        setState(prev => ({ ...prev, isHyperbolic: !prev.isHyperbolic }));
        break;

      case 'clear':
        setState(prev => ({
          ...prev,
          display: '0',
          expression: '',
          isError: false,
          isShiftActive: false,
        }));
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
  }, [state.isDegreeMode, state.isHyperbolic, storageService, animateDisplayUpdate]);

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
        CalculatorType.SCIENTIFIC
      );

      if (!validation.isValid) {
        throw new Error(validation.errors[0] || '表达式无效');
      }

      // 解析和计算表达式
      const expression = await calculatorService.parseExpression(
        state.expression,
        CalculatorType.SCIENTIFIC
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
        isShiftActive: false,
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
      await storageService.saveExpression(expression);
      await storageService.saveResult(result);

      const history = new HistoryModel(
        expression.id,
        result.id,
        CalculatorType.SCIENTIFIC,
        {
          notes: `${expression.input} = ${result.displayValue}`,
          tags: ['scientific'],
        }
      );

      await storageService.saveHistory(history.toJSON());

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
      isShiftActive: false,
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
  const renderButton = useCallback((button: ScientificButton) => {
    const isActive = button.id === 'shift' && state.isShiftActive;
    const currentLabel = state.isShiftActive && button.shiftLabel ? button.shiftLabel : button.label;
    const isSpecialMode = (button.id === 'deg_rad' && !state.isDegreeMode) ||
                         (button.id === 'hyp' && state.isHyperbolic);

    const buttonStyle = [
      styles.button,
      styles[`button_${button.style || 'default'}`],
      isActive ? styles.buttonActive : {},
      isSpecialMode ? styles.buttonSpecialMode : {},
      button.disabled ? styles.buttonDisabled : {},
    ];

    const textStyle = [
      styles.buttonText,
      styles[`buttonText_${button.style || 'default'}`],
      isActive ? styles.buttonTextActive : {},
      isSpecialMode ? styles.buttonTextSpecialMode : {},
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
          <Text style={textStyle} adjustsFontSizeToFit numberOfLines={1}>
            {currentLabel}
          </Text>
          {/* Shift指示器 */}
          {button.shiftLabel && (
            <Animated.View
              style={[
                styles.shiftIndicator,
                { opacity: shiftIndicatorAnim },
              ]}
            >
              <Text style={styles.shiftText}>{button.shiftLabel}</Text>
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>
    );
  }, [buttonPressAnim, shiftIndicatorAnim, handleButtonPress, state.isCalculating, state.isShiftActive, state.isDegreeMode, state.isHyperbolic]);

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

        {/* 状态指示器 */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {state.isDegreeMode ? 'DEG' : 'RAD'}
          </Text>
          {state.isHyperbolic && (
            <Text style={styles.statusText}>HYP</Text>
          )}
          {state.memoryValue !== '0' && (
            <Text style={styles.statusText}>M</Text>
          )}
          {state.isShiftActive && (
            <Animated.Text
              style={[
                styles.statusText,
                styles.shiftStatusText,
                { opacity: shiftIndicatorAnim }
              ]}
            >
              SHIFT
            </Animated.Text>
          )}
        </View>
      </View>

      {/* 内存按钮 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.memoryButtonsContainer}
        contentContainerStyle={styles.memoryButtonsContent}
      >
        {MEMORY_BUTTONS.map(renderButton)}
      </ScrollView>

      {/* 科学计算器键盘 */}
      <View style={styles.keypadContainer}>
        {SCIENTIFIC_BUTTON_LAYOUT.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.buttonRow}>
            {row.map(renderButton)}
          </View>
        ))}
      </View>

      {/* 历史记录 */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>科学计算历史</Text>
        <ScrollView style={styles.historyList}>
          {state.history.slice(0, 5).map(renderHistoryItem)}
        </ScrollView>
      </View>

      {/* 加载指示器 */}
      {state.isCalculating && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>科学计算中...</Text>
        </View>
      )}
    </ScrollView>
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
    fontSize: 32,
    fontWeight: '300',
    color: '#333',
    textAlign: 'right',
    fontFamily: 'monospace',
  },

  displayTextError: {
    color: '#ff4444',
  },

  expressionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
    fontFamily: 'monospace',
  },

  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },

  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },

  shiftStatusText: {
    backgroundColor: '#FF9500',
    color: '#ffffff',
  },

  memoryButtonsContainer: {
    marginBottom: 16,
  },

  memoryButtonsContent: {
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
    height: 55,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
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

  button_function: {
    backgroundColor: '#4CAF50',
  },

  buttonActive: {
    backgroundColor: '#FF9500',
  },

  buttonSpecialMode: {
    backgroundColor: '#2196F3',
  },

  buttonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.8,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    fontSize: 16,
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

  buttonText_function: {
    color: '#ffffff',
  },

  buttonTextActive: {
    color: '#ffffff',
  },

  buttonTextSpecialMode: {
    color: '#ffffff',
  },

  buttonTextDisabled: {
    color: '#999',
  },

  shiftIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255, 149, 0, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },

  shiftText: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: 'bold',
  },

  historyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    height: 200,
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

export default ScientificCalculator;