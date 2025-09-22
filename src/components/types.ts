/**
 * Component Types
 *
 * 组件通用类型定义
 */

import { ViewStyle, TextStyle } from 'react-native';

// Display组件属性
export interface DisplayProps {
  value: string;
  expression?: string;
  history?: string[];
  mode?: 'standard' | 'scientific' | 'graphing';
  theme?: 'light' | 'dark';
  showHistory?: boolean;
  maxHistoryItems?: number;
  animated?: boolean;
}

// Button组件属性
export interface ButtonProps {
  value: string;
  label?: string;
  onPress: (value: string) => void;
  onLongPress?: (value: string) => void;
  type?: 'number' | 'operator' | 'function' | 'action' | 'special';
  size?: 'small' | 'medium' | 'large' | 'wide';
  theme?: 'light' | 'dark';
  disabled?: boolean;
  highlighted?: boolean;
  vibration?: boolean;
  animation?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

// Keypad组件属性
export interface KeypadProps {
  mode?: 'basic' | 'scientific' | 'graphing' | 'custom';
  theme?: 'light' | 'dark';
  onButtonPress: (value: string) => void;
  onButtonLongPress?: (value: string) => void;
  landscape?: boolean;
  customLayout?: KeypadButton[][];
  disabled?: boolean;
  highlightedButtons?: string[];
}

// Keypad按钮定义
export interface KeypadButton {
  value: string;
  label?: string;
  type?: 'number' | 'operator' | 'function' | 'action' | 'special';
  size?: 'small' | 'medium' | 'large' | 'wide';
  colspan?: number;
  longPressAction?: string;
}