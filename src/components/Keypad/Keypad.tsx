/**
 * Keypad Component
 *
 * 计算器键盘组件，支持不同布局模式和自适应按钮排列
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';

import { Button } from '@/components/Button/Button';

type KeypadMode = 'basic' | 'scientific' | 'graphing' | 'custom';
type KeypadTheme = 'light' | 'dark';

interface KeypadButton {
  value: string;
  label?: string;
  type?: 'number' | 'operator' | 'function' | 'action' | 'special';
  size?: 'small' | 'medium' | 'large' | 'wide';
  colspan?: number;
  longPressAction?: string;
}

interface KeypadProps {
  mode?: KeypadMode;
  theme?: KeypadTheme;
  onButtonPress: (value: string) => void;
  onButtonLongPress?: (value: string) => void;
  landscape?: boolean;
  customLayout?: KeypadButton[][];
  disabled?: boolean;
  highlightedButtons?: string[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 基础计算器布局
const BASIC_LAYOUT: KeypadButton[][] = [
  [
    { value: 'clear', label: 'C', type: 'action' },
    { value: 'plusminus', label: '±', type: 'function' },
    { value: 'percent', label: '%', type: 'function' },
    { value: '/', type: 'operator' },
  ],
  [
    { value: '7', type: 'number' },
    { value: '8', type: 'number' },
    { value: '9', type: 'number' },
    { value: '*', type: 'operator' },
  ],
  [
    { value: '4', type: 'number' },
    { value: '5', type: 'number' },
    { value: '6', type: 'number' },
    { value: '-', type: 'operator' },
  ],
  [
    { value: '1', type: 'number' },
    { value: '2', type: 'number' },
    { value: '3', type: 'number' },
    { value: '+', type: 'operator' },
  ],
  [
    { value: '0', type: 'number', size: 'wide', colspan: 2 },
    { value: '.', type: 'number' },
    { value: '=', type: 'special' },
  ],
];

// 科学计算器布局
const SCIENTIFIC_LAYOUT: KeypadButton[][] = [
  [
    { value: 'clear', label: 'C', type: 'action', size: 'small' },
    { value: 'delete', label: '⌫', type: 'action', size: 'small' },
    { value: 'pi', label: 'π', type: 'function', size: 'small' },
    { value: 'e', type: 'function', size: 'small' },
    { value: '/', type: 'operator', size: 'small' },
  ],
  [
    { value: 'sin', type: 'function', size: 'small' },
    { value: 'cos', type: 'function', size: 'small' },
    { value: 'tan', type: 'function', size: 'small' },
    { value: 'log', type: 'function', size: 'small' },
    { value: '*', type: 'operator', size: 'small' },
  ],
  [
    { value: 'asin', label: 'sin⁻¹', type: 'function', size: 'small' },
    { value: 'acos', label: 'cos⁻¹', type: 'function', size: 'small' },
    { value: 'atan', label: 'tan⁻¹', type: 'function', size: 'small' },
    { value: 'ln', type: 'function', size: 'small' },
    { value: '-', type: 'operator', size: 'small' },
  ],
  [
    { value: 'sqrt', label: '√', type: 'function', size: 'small' },
    { value: 'pow', label: 'x²', type: 'function', size: 'small' },
    { value: 'pow3', label: 'x³', type: 'function', size: 'small' },
    { value: 'factorial', label: 'x!', type: 'function', size: 'small' },
    { value: '+', type: 'operator', size: 'small' },
  ],
  [
    { value: '(', type: 'function', size: 'small' },
    { value: ')', type: 'function', size: 'small' },
    { value: 'exp', label: 'eˣ', type: 'function', size: 'small' },
    { value: 'mod', label: 'mod', type: 'function', size: 'small' },
    { value: '=', type: 'special', size: 'small' },
  ],
  [
    { value: '7', type: 'number', size: 'small' },
    { value: '8', type: 'number', size: 'small' },
    { value: '9', type: 'number', size: 'small' },
    { value: '4', type: 'number', size: 'small' },
    { value: '5', type: 'number', size: 'small' },
  ],
  [
    { value: '6', type: 'number', size: 'small' },
    { value: '1', type: 'number', size: 'small' },
    { value: '2', type: 'number', size: 'small' },
    { value: '3', type: 'number', size: 'small' },
    { value: '0', type: 'number', size: 'small' },
  ],
  [
    { value: '.', type: 'number', size: 'small' },
    { value: 'plusminus', label: '±', type: 'function', size: 'small' },
    { value: 'ans', label: 'Ans', type: 'function', size: 'small' },
    { value: 'history', label: 'Hist', type: 'action', size: 'small' },
    { value: 'deg', label: 'DEG', type: 'action', size: 'small' },
  ],
];

// 图形计算器布局
const GRAPHING_LAYOUT: KeypadButton[][] = [
  [
    { value: 'graph', label: 'GRAPH', type: 'special' },
    { value: 'table', label: 'TABLE', type: 'function' },
    { value: 'zoom', label: 'ZOOM', type: 'function' },
    { value: 'trace', label: 'TRACE', type: 'function' },
  ],
  [
    { value: 'y1', label: 'Y₁=', type: 'function' },
    { value: 'y2', label: 'Y₂=', type: 'function' },
    { value: 'y3', label: 'Y₃=', type: 'function' },
    { value: 'clear', label: 'CLEAR', type: 'action' },
  ],
  [
    { value: 'x', label: 'X', type: 'function' },
    { value: 'sin', type: 'function' },
    { value: 'cos', type: 'function' },
    { value: 'tan', type: 'function' },
  ],
  [
    { value: '(', type: 'function' },
    { value: ')', type: 'function' },
    { value: '^', label: '^', type: 'operator' },
    { value: 'sqrt', label: '√', type: 'function' },
  ],
  [
    { value: '7', type: 'number' },
    { value: '8', type: 'number' },
    { value: '9', type: 'number' },
    { value: '/', type: 'operator' },
  ],
  [
    { value: '4', type: 'number' },
    { value: '5', type: 'number' },
    { value: '6', type: 'number' },
    { value: '*', type: 'operator' },
  ],
  [
    { value: '1', type: 'number' },
    { value: '2', type: 'number' },
    { value: '3', type: 'number' },
    { value: '-', type: 'operator' },
  ],
  [
    { value: '0', type: 'number' },
    { value: '.', type: 'number' },
    { value: 'enter', label: 'ENTER', type: 'special' },
    { value: '+', type: 'operator' },
  ],
];

export const Keypad: React.FC<KeypadProps> = ({
  mode = 'basic',
  theme = 'light',
  onButtonPress,
  onButtonLongPress,
  landscape = false,
  customLayout,
  disabled = false,
  highlightedButtons = [],
}) => {
  const [currentLayout, setCurrentLayout] = useState<KeypadButton[][]>(() => {
    if (customLayout) return customLayout;

    switch (mode) {
      case 'scientific':
        return SCIENTIFIC_LAYOUT;
      case 'graphing':
        return GRAPHING_LAYOUT;
      default:
        return BASIC_LAYOUT;
    }
  });

  // 处理按钮点击
  const handleButtonPress = useCallback((value: string) => {
    if (disabled) return;
    onButtonPress(value);
  }, [disabled, onButtonPress]);

  // 处理按钮长按
  const handleButtonLongPress = useCallback((value: string) => {
    if (disabled || !onButtonLongPress) return;
    onButtonLongPress(value);
  }, [disabled, onButtonLongPress]);

  // 获取按钮尺寸
  const getButtonSize = useCallback((button: KeypadButton, rowLength: number) => {
    if (button.size) return button.size;

    // 根据模式和屏幕方向自动决定尺寸
    if (mode === 'scientific') {
      return landscape ? 'small' : 'small';
    } else if (mode === 'graphing') {
      return 'medium';
    } else {
      return 'large';
    }
  }, [mode, landscape]);

  // 计算网格布局
  const calculateGridLayout = () => {
    const isLandscape = landscape || SCREEN_WIDTH > SCREEN_HEIGHT;
    const availableWidth = SCREEN_WIDTH - 32; // 减去padding
    const maxColumns = mode === 'scientific' ? (isLandscape ? 8 : 5) : 4;

    return {
      isLandscape,
      maxColumns,
      availableWidth,
    };
  };

  // 渲染按钮行
  const renderButtonRow = (row: KeypadButton[], rowIndex: number) => {
    const { maxColumns } = calculateGridLayout();

    return (
      <View key={rowIndex} style={styles.buttonRow}>
        {row.map((button, buttonIndex) => {
          const isHighlighted = highlightedButtons.includes(button.value);
          const buttonSize = getButtonSize(button, row.length);

          return (
            <Button
              key={`${rowIndex}-${buttonIndex}`}
              value={button.value}
              label={button.label}
              type={button.type}
              size={buttonSize}
              theme={theme}
              disabled={disabled}
              highlighted={isHighlighted}
              onPress={handleButtonPress}
              onLongPress={button.longPressAction ? handleButtonLongPress : undefined}
              accessibilityLabel={`计算器按钮 ${button.label || button.value}`}
            />
          );
        })}
      </View>
    );
  };

  // 渲染键盘
  const renderKeypad = () => {
    const { isLandscape } = calculateGridLayout();

    if (mode === 'scientific' && isLandscape) {
      // 科学计算器横屏模式：重新排列布局
      const flatButtons = currentLayout.flat();
      const chunkedButtons: KeypadButton[][] = [];

      for (let i = 0; i < flatButtons.length; i += 8) {
        chunkedButtons.push(flatButtons.slice(i, i + 8));
      }

      return chunkedButtons.map((row, index) => renderButtonRow(row, index));
    }

    return currentLayout.map((row, index) => renderButtonRow(row, index));
  };

  const { isLandscape } = calculateGridLayout();

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme === 'dark' ? '#000000' : '#f2f2f7' },
    ]}>
      {mode === 'scientific' && isLandscape ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.keypadGrid}>
            {renderKeypad()}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.keypadGrid}>
            {renderKeypad()}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  keypadGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
});

export default Keypad;