/**
 * Display Component
 *
 * 计算器显示屏组件，支持多行显示、历史记录和自适应字体大小
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';

import { ValidationUtils } from '@/utils/validation';

interface DisplayProps {
  value: string;
  expression?: string;
  history?: string[];
  mode?: 'standard' | 'scientific' | 'graphing';
  theme?: 'light' | 'dark';
  showHistory?: boolean;
  maxHistoryItems?: number;
  animated?: boolean;
}

interface DisplayState {
  displayHeight: number;
  fontSize: number;
  isScrollable: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_DISPLAY_WIDTH = SCREEN_WIDTH - 32; // 减去padding
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 36;
const DEFAULT_FONT_SIZE = 24;

export const Display: React.FC<DisplayProps> = ({
  value = '0',
  expression = '',
  history = [],
  mode = 'standard',
  theme = 'light',
  showHistory = false,
  maxHistoryItems = 5,
  animated = true,
}) => {
  const [state, setState] = useState<DisplayState>({
    displayHeight: 80,
    fontSize: DEFAULT_FONT_SIZE,
    isScrollable: false,
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // 计算合适的字体大小
  const calculateFontSize = (text: string, maxWidth: number): number => {
    // 简化的字体大小计算，基于文本长度
    const textLength = text.length;
    let fontSize = DEFAULT_FONT_SIZE;

    if (textLength > 15) {
      fontSize = Math.max(MIN_FONT_SIZE, DEFAULT_FONT_SIZE - (textLength - 15) * 2);
    } else if (textLength < 8) {
      fontSize = Math.min(MAX_FONT_SIZE, DEFAULT_FONT_SIZE + (8 - textLength) * 2);
    }

    return fontSize;
  };

  // 数值变化动画
  const animateValueChange = () => {
    if (!animated) return;

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 历史记录滑入动画
  const animateHistoryToggle = (show: boolean) => {
    if (!animated) return;

    Animated.spring(slideAnim, {
      toValue: show ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  // 监听value变化触发动画
  useEffect(() => {
    animateValueChange();

    // 计算字体大小
    const newFontSize = calculateFontSize(value, MAX_DISPLAY_WIDTH);
    setState(prev => ({ ...prev, fontSize: newFontSize }));
  }, [value]);

  // 监听历史记录显示状态
  useEffect(() => {
    animateHistoryToggle(showHistory);
  }, [showHistory]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollViewRef.current && showHistory) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [history, showHistory]);

  const formatValue = (val: string): string => {
    // 格式化显示值
    if (!val || val === '') return '0';

    // 验证并格式化数字
    try {
      if (ValidationUtils.isValidNumber(val)) {
        const num = parseFloat(val);
        if (Math.abs(num) >= 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) {
          // 科学计数法
          return num.toExponential(6);
        } else {
          // 普通格式，最多显示8位小数
          return parseFloat(num.toFixed(8)).toString();
        }
      }
    } catch (error) {
      // 如果不是数字，直接返回
    }

    return val;
  };

  const formatExpression = (expr: string): string => {
    // 格式化表达式，替换一些符号为更易读的形式
    return expr
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/Math\.PI/g, 'π')
      .replace(/Math\.E/g, 'e');
  };

  const getThemeStyles = () => {
    if (theme === 'dark') {
      return {
        container: { backgroundColor: '#1c1c1e' },
        value: { color: '#ffffff' },
        expression: { color: '#8e8e93' },
        history: { backgroundColor: '#2c2c2e' },
        historyItem: { color: '#8e8e93' },
      };
    } else {
      return {
        container: { backgroundColor: '#ffffff' },
        value: { color: '#000000' },
        expression: { color: '#666666' },
        history: { backgroundColor: '#f2f2f7' },
        historyItem: { color: '#666666' },
      };
    }
  };

  const getModeStyles = () => {
    switch (mode) {
      case 'scientific':
        return {
          container: { minHeight: 120 },
          additionalInfo: true,
        };
      case 'graphing':
        return {
          container: { minHeight: 100 },
          compact: true,
        };
      default:
        return {
          container: { minHeight: 80 },
        };
    }
  };

  const themeStyles = getThemeStyles();
  const modeStyles = getModeStyles();

  const renderMainDisplay = () => (
    <View style={[styles.mainDisplay, modeStyles.container]}>
      {/* 表达式显示 */}
      {expression && expression !== value && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text
            style={[
              styles.expression,
              themeStyles.expression,
              { fontSize: state.fontSize * 0.7 },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatExpression(expression)}
          </Text>
        </Animated.View>
      )}

      {/* 主要数值显示 */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text
          style={[
            styles.value,
            themeStyles.value,
            { fontSize: state.fontSize },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {formatValue(value)}
        </Text>
      </Animated.View>

      {/* 模式特定信息 */}
      {modeStyles.additionalInfo && (
        <View style={styles.additionalInfo}>
          <Text style={[styles.modeInfo, themeStyles.expression]}>
            {mode === 'scientific' ? '科学计算器' : ''}
          </Text>
        </View>
      )}
    </View>
  );

  const renderHistory = () => {
    if (!showHistory || history.length === 0) return null;

    const visibleHistory = history.slice(-maxHistoryItems);

    return (
      <Animated.View
        style={[
          styles.historyContainer,
          themeStyles.history,
          {
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            }],
            opacity: slideAnim,
          },
        ]}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.historyScroll}
          showsVerticalScrollIndicator={false}
        >
          {visibleHistory.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <Text
                style={[styles.historyText, themeStyles.historyItem]}
                numberOfLines={1}
              >
                {formatExpression(item)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      {renderHistory()}
      {renderMainDisplay()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  mainDisplay: {
    padding: 20,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },

  expression: {
    textAlign: 'right',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  value: {
    textAlign: 'right',
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },

  additionalInfo: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },

  modeInfo: {
    fontSize: 12,
    fontStyle: 'italic',
  },

  historyContainer: {
    maxHeight: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },

  historyScroll: {
    padding: 12,
  },

  historyItem: {
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },

  historyText: {
    fontSize: 14,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default Display;