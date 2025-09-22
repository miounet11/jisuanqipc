/**
 * Geometry Calculator Module
 *
 * 几何计算器模块，支持几何图形计算和分析
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';

import { MathUtils } from '@/utils/math';
import { ValidationUtils } from '@/utils/validation';

// 几何图形类型
type GeometryType = 'circle' | 'triangle' | 'rectangle' | 'polygon';

interface GeometryState {
  selectedType: GeometryType;
  inputs: Record<string, string>;
  results: Record<string, number>;
  isCalculating: boolean;
}

const GEOMETRY_DEFINITIONS = {
  circle: {
    name: '圆形',
    inputs: ['radius'],
    labels: { radius: '半径' },
    calculations: {
      area: (r: number) => Math.PI * r * r,
      circumference: (r: number) => 2 * Math.PI * r,
      diameter: (r: number) => 2 * r,
    },
  },
  triangle: {
    name: '三角形',
    inputs: ['side1', 'side2', 'side3'],
    labels: { side1: '边长a', side2: '边长b', side3: '边长c' },
    calculations: {
      area: (a: number, b: number, c: number) => {
        const s = (a + b + c) / 2;
        return Math.sqrt(s * (s - a) * (s - b) * (s - c));
      },
      perimeter: (a: number, b: number, c: number) => a + b + c,
    },
  },
  rectangle: {
    name: '矩形',
    inputs: ['width', 'height'],
    labels: { width: '宽度', height: '高度' },
    calculations: {
      area: (w: number, h: number) => w * h,
      perimeter: (w: number, h: number) => 2 * (w + h),
      diagonal: (w: number, h: number) => Math.sqrt(w * w + h * h),
    },
  },
  polygon: {
    name: '正多边形',
    inputs: ['sides', 'sideLength'],
    labels: { sides: '边数', sideLength: '边长' },
    calculations: {
      area: (n: number, s: number) => (n * s * s) / (4 * Math.tan(Math.PI / n)),
      perimeter: (n: number, s: number) => n * s,
      internalAngle: (n: number) => ((n - 2) * 180) / n,
    },
  },
};

export const GeometryCalculator: React.FC = () => {
  const [state, setState] = useState<GeometryState>({
    selectedType: 'circle',
    inputs: {},
    results: {},
    isCalculating: false,
  });

  const currentGeometry = GEOMETRY_DEFINITIONS[state.selectedType];

  const handleInputChange = useCallback((key: string, value: string) => {
    setState(prev => ({
      ...prev,
      inputs: { ...prev.inputs, [key]: value },
    }));
  }, []);

  const calculate = useCallback(() => {
    setState(prev => ({ ...prev, isCalculating: true }));

    try {
      const values = currentGeometry.inputs.map(key => {
        const value = parseFloat(state.inputs[key] || '0');
        if (isNaN(value) || value <= 0) {
          throw new Error(`请输入有效的${currentGeometry.labels[key]}`);
        }
        return value;
      });

      const results: Record<string, number> = {};

      Object.entries(currentGeometry.calculations).forEach(([key, calc]) => {
        results[key] = calc(...values);
      });

      setState(prev => ({
        ...prev,
        results,
        isCalculating: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isCalculating: false }));
      Alert.alert('计算错误', error instanceof Error ? error.message : '计算失败');
    }
  }, [state.inputs, currentGeometry]);

  const renderGeometrySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>选择几何图形</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Object.entries(GEOMETRY_DEFINITIONS).map(([key, def]) => (
          <Pressable
            key={key}
            style={[
              styles.selectorButton,
              state.selectedType === key ? styles.selectorButtonActive : {},
            ]}
            onPress={() => setState(prev => ({
              ...prev,
              selectedType: key as GeometryType,
              inputs: {},
              results: {},
            }))}
          >
            <Text
              style={[
                styles.selectorButtonText,
                state.selectedType === key ? styles.selectorButtonTextActive : {},
              ]}
            >
              {def.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderInputs = () => (
    <View style={styles.inputsContainer}>
      <Text style={styles.inputsTitle}>{currentGeometry.name}参数</Text>
      {currentGeometry.inputs.map(key => (
        <View key={key} style={styles.inputRow}>
          <Text style={styles.inputLabel}>{currentGeometry.labels[key]}</Text>
          <TextInput
            style={styles.input}
            value={state.inputs[key] || ''}
            onChangeText={(value) => handleInputChange(key, value)}
            placeholder="请输入数值"
            keyboardType="numeric"
          />
        </View>
      ))}
    </View>
  );

  const renderResults = () => {
    if (Object.keys(state.results).length === 0) return null;

    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>计算结果</Text>
        {Object.entries(state.results).map(([key, value]) => (
          <View key={key} style={styles.resultRow}>
            <Text style={styles.resultLabel}>{getResultLabel(key)}</Text>
            <Text style={styles.resultValue}>{value.toFixed(4)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const getResultLabel = (key: string): string => {
    const labels: Record<string, string> = {
      area: '面积',
      perimeter: '周长',
      circumference: '周长',
      diameter: '直径',
      diagonal: '对角线长度',
      internalAngle: '内角度数',
    };
    return labels[key] || key;
  };

  return (
    <ScrollView style={styles.container}>
      {renderGeometrySelector()}
      {renderInputs()}

      <Pressable
        style={styles.calculateButton}
        onPress={calculate}
        disabled={state.isCalculating}
      >
        <Text style={styles.calculateButtonText}>
          {state.isCalculating ? '计算中...' : '计算'}
        </Text>
      </Pressable>

      {renderResults()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },

  selectorContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  selectorButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },

  selectorButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  selectorButtonText: {
    fontSize: 14,
    color: '#666',
  },

  selectorButtonTextActive: {
    color: '#ffffff',
  },

  inputsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  inputsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  inputRow: {
    marginBottom: 12,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },

  calculateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },

  calculateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },

  resultsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },

  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  resultLabel: {
    fontSize: 14,
    color: '#333',
  },

  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    fontFamily: 'monospace',
  },
});

export default GeometryCalculator;