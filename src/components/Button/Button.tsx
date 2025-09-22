/**
 * Button Component
 *
 * 计算器按钮组件，支持多种样式、动画效果和触觉反馈
 */

import React, { useRef, useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  Animated,
  Vibration,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { ValidationUtils } from '@/utils/validation';

type ButtonType = 'number' | 'operator' | 'function' | 'action' | 'special';
type ButtonSize = 'small' | 'medium' | 'large' | 'wide';
type ButtonTheme = 'light' | 'dark';

interface ButtonProps {
  value: string;
  label?: string;
  onPress: (value: string) => void;
  onLongPress?: (value: string) => void;
  type?: ButtonType;
  size?: ButtonSize;
  theme?: ButtonTheme;
  disabled?: boolean;
  highlighted?: boolean;
  vibration?: boolean;
  animation?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

interface ButtonState {
  isPressed: boolean;
  isHighlighted: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  value,
  label,
  onPress,
  onLongPress,
  type = 'number',
  size = 'medium',
  theme = 'light',
  disabled = false,
  highlighted = false,
  vibration = true,
  animation = true,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const [state, setState] = useState<ButtonState>({
    isPressed: false,
    isHighlighted: highlighted,
  });

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  // 按下动画
  const animatePress = () => {
    if (!animation) return;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 释放动画
  const animateRelease = () => {
    if (!animation) return;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 波纹动画
  const animateRipple = () => {
    if (!animation) return;

    rippleAnim.setValue(0);
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      rippleAnim.setValue(0);
    });
  };

  // 触觉反馈
  const triggerVibration = () => {
    if (!vibration) return;

    if (Platform.OS === 'ios') {
      // iOS 触觉反馈
      const ReactNativeHapticFeedback = require('react-native-haptic-feedback');
      if (ReactNativeHapticFeedback) {
        const options = {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        };

        switch (type) {
          case 'operator':
          case 'function':
            ReactNativeHapticFeedback.trigger('impactMedium', options);
            break;
          case 'action':
          case 'special':
            ReactNativeHapticFeedback.trigger('impactHeavy', options);
            break;
          default:
            ReactNativeHapticFeedback.trigger('impactLight', options);
        }
      }
    } else {
      // Android 振动
      switch (type) {
        case 'operator':
        case 'function':
          Vibration.vibrate(50);
          break;
        case 'action':
        case 'special':
          Vibration.vibrate([0, 50, 50, 50]);
          break;
        default:
          Vibration.vibrate(25);
      }
    }
  };

  // 处理按压
  const handlePressIn = () => {
    setState(prev => ({ ...prev, isPressed: true }));
    animatePress();
    triggerVibration();
  };

  // 处理释放
  const handlePressOut = () => {
    setState(prev => ({ ...prev, isPressed: false }));
    animateRelease();
  };

  // 处理点击
  const handlePress = () => {
    animateRipple();
    onPress(value);
  };

  // 处理长按
  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(value);
    }
  };

  // 获取按钮类型样式
  const getTypeStyles = () => {
    const baseColors = theme === 'dark' ? {
      number: { bg: '#333333', text: '#ffffff', border: '#444444' },
      operator: { bg: '#ff9500', text: '#ffffff', border: '#ff9500' },
      function: { bg: '#a6a6a6', text: '#000000', border: '#a6a6a6' },
      action: { bg: '#ff3b30', text: '#ffffff', border: '#ff3b30' },
      special: { bg: '#34c759', text: '#ffffff', border: '#34c759' },
    } : {
      number: { bg: '#f2f2f7', text: '#000000', border: '#d1d1d6' },
      operator: { bg: '#ff9500', text: '#ffffff', border: '#ff9500' },
      function: { bg: '#a6a6a6', text: '#000000', border: '#a6a6a6' },
      action: { bg: '#ff3b30', text: '#ffffff', border: '#ff3b30' },
      special: { bg: '#34c759', text: '#ffffff', border: '#34c759' },
    };

    const colors = baseColors[type];

    return {
      backgroundColor: state.isHighlighted ? colors.border : colors.bg,
      borderColor: colors.border,
      color: colors.text,
    };
  };

  // 获取尺寸样式
  const getSizeStyles = () => {
    const sizes = {
      small: { width: 50, height: 50, fontSize: 16 },
      medium: { width: 70, height: 70, fontSize: 20 },
      large: { width: 90, height: 90, fontSize: 24 },
      wide: { width: 150, height: 70, fontSize: 20 },
    };

    return sizes[size];
  };

  // 格式化显示标签
  const getDisplayLabel = (): string => {
    if (label) return label;

    // 特殊符号转换
    const symbolMap: Record<string, string> = {
      '+': '+',
      '-': '−',
      '*': '×',
      '/': '÷',
      '=': '=',
      '.': '.',
      'sqrt': '√',
      'pow': 'x²',
      'sin': 'sin',
      'cos': 'cos',
      'tan': 'tan',
      'log': 'log',
      'ln': 'ln',
      'pi': 'π',
      'e': 'e',
      'clear': 'C',
      'delete': '⌫',
      'percent': '%',
      'plusminus': '±',
    };

    return symbolMap[value] || value;
  };

  const typeStyles = getTypeStyles();
  const sizeStyles = getSizeStyles();
  const displayLabel = getDisplayLabel();

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        style={[
          styles.button,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            backgroundColor: typeStyles.backgroundColor,
            borderColor: typeStyles.borderColor,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={onLongPress ? handleLongPress : undefined}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel || `按钮 ${displayLabel}`}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        {/* 波纹效果 */}
        {animation && (
          <Animated.View
            style={[
              styles.ripple,
              {
                opacity: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3],
                }),
                transform: [{
                  scale: rippleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 2],
                  }),
                }],
              },
            ]}
          />
        )}

        {/* 按钮文本 */}
        <Text
          style={[
            styles.buttonText,
            {
              fontSize: sizeStyles.fontSize,
              color: typeStyles.color,
            },
            textStyle,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {displayLabel}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 35,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    overflow: 'hidden',
  },

  buttonText: {
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'San Francisco' : 'Roboto',
  },

  ripple: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 35,
  },
});

export default Button;