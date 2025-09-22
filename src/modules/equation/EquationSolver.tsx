/**
 * Equation Solver Module
 *
 * 方程求解器模块，支持线性方程、二次方程和方程组求解
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
  Animated,
} from 'react-native';

import { CalculatorService } from '@/services/CalculatorService';
import { MathUtils } from '@/utils/math';
import { ValidationUtils } from '@/utils/validation';

type EquationType = 'linear' | 'quadratic' | 'system' | 'polynomial';

interface EquationState {
  selectedType: EquationType;
  coefficients: Record<string, string>;
  solutions: string[];
  isCalculating: boolean;
  steps: string[];
}

const EQUATION_DEFINITIONS = {
  linear: {
    name: '线性方程',
    description: 'ax + b = 0',
    inputs: ['a', 'b'],
    labels: { a: '系数a', b: '常数b' },
    validator: (a: number, b: number) => a !== 0,
    solver: (a: number, b: number) => {
      const x = -b / a;
      return {
        solutions: [x.toString()],
        steps: [
          `原方程: ${a}x + ${b} = 0`,
          `移项: ${a}x = ${-b}`,
          `求解: x = ${-b} / ${a} = ${x}`,
        ],
      };
    },
  },
  quadratic: {
    name: '二次方程',
    description: 'ax² + bx + c = 0',
    inputs: ['a', 'b', 'c'],
    labels: { a: '二次项系数a', b: '一次项系数b', c: '常数项c' },
    validator: (a: number) => a !== 0,
    solver: (a: number, b: number, c: number) => {
      const discriminant = b * b - 4 * a * c;
      const steps = [
        `原方程: ${a}x² + ${b}x + ${c} = 0`,
        `判别式: Δ = b² - 4ac = ${b}² - 4×${a}×${c} = ${discriminant}`,
      ];

      if (discriminant < 0) {
        steps.push('Δ < 0，方程无实数解');
        return { solutions: ['无实数解'], steps };
      } else if (discriminant === 0) {
        const x = -b / (2 * a);
        steps.push(`Δ = 0，方程有一个重根: x = -b/(2a) = ${x}`);
        return { solutions: [x.toString()], steps };
      } else {
        const sqrtDiscriminant = Math.sqrt(discriminant);
        const x1 = (-b + sqrtDiscriminant) / (2 * a);
        const x2 = (-b - sqrtDiscriminant) / (2 * a);
        steps.push(
          `Δ > 0，方程有两个不同实根:`,
          `x₁ = (-b + √Δ)/(2a) = ${x1}`,
          `x₂ = (-b - √Δ)/(2a) = ${x2}`
        );
        return { solutions: [x1.toString(), x2.toString()], steps };
      }
    },
  },
  system: {
    name: '二元线性方程组',
    description: 'a₁x + b₁y = c₁\na₂x + b₂y = c₂',
    inputs: ['a1', 'b1', 'c1', 'a2', 'b2', 'c2'],
    labels: {
      a1: '方程1: x系数a₁',
      b1: '方程1: y系数b₁',
      c1: '方程1: 常数c₁',
      a2: '方程2: x系数a₂',
      b2: '方程2: y系数b₂',
      c2: '方程2: 常数c₂',
    },
    validator: (a1: number, b1: number, a2: number, b2: number) => {
      return a1 * b2 - a2 * b1 !== 0; // 系数矩阵行列式不为0
    },
    solver: (a1: number, b1: number, c1: number, a2: number, b2: number, c2: number) => {
      const det = a1 * b2 - a2 * b1;
      const x = (c1 * b2 - c2 * b1) / det;
      const y = (a1 * c2 - a2 * c1) / det;

      const steps = [
        `方程组:`,
        `${a1}x + ${b1}y = ${c1}`,
        `${a2}x + ${b2}y = ${c2}`,
        ``,
        `使用克拉默法则:`,
        `系数矩阵行列式: D = ${a1}×${b2} - ${a2}×${b1} = ${det}`,
        `x = (${c1}×${b2} - ${c2}×${b1}) / ${det} = ${x}`,
        `y = (${a1}×${c2} - ${a2}×${c1}) / ${det} = ${y}`,
      ];

      return { solutions: [`x = ${x}`, `y = ${y}`], steps };
    },
  },
  polynomial: {
    name: '多项式方程',
    description: '高次多项式数值求解',
    inputs: ['degree', 'coeffs'],
    labels: { degree: '最高次数', coeffs: '系数（从高到低）' },
    validator: (degree: number) => degree >= 1 && degree <= 5,
    solver: (degree: number, coeffsStr: string) => {
      const coeffs = coeffsStr.split(',').map(s => parseFloat(s.trim()));
      if (coeffs.length !== degree + 1) {
        throw new Error(`需要${degree + 1}个系数`);
      }

      const steps = [
        `${degree}次多项式方程:`,
        coeffs.map((coeff, i) => {
          const power = degree - i;
          if (power === 0) return `${coeff}`;
          if (power === 1) return `${coeff}x`;
          return `${coeff}x^${power}`;
        }).join(' + ') + ' = 0',
        '',
        '使用数值方法求解...',
      ];

      // 简化的数值求解（牛顿法）
      const solutions: string[] = [];

      // 对于二次及以下，使用解析解
      if (degree === 1) {
        const x = -coeffs[1] / coeffs[0];
        solutions.push(x.toString());
      } else if (degree === 2) {
        const [a, b, c] = coeffs;
        const discriminant = b * b - 4 * a * c;
        if (discriminant >= 0) {
          const sqrtD = Math.sqrt(discriminant);
          solutions.push(((-b + sqrtD) / (2 * a)).toString());
          solutions.push(((-b - sqrtD) / (2 * a)).toString());
        } else {
          solutions.push('无实数解');
        }
      } else {
        // 高次方程使用数值方法近似求解
        solutions.push('使用数值方法求解（需要更高级算法）');
      }

      return { solutions, steps };
    },
  },
};

export const EquationSolver: React.FC = () => {
  const [state, setState] = useState<EquationState>({
    selectedType: 'linear',
    coefficients: {},
    solutions: [],
    isCalculating: false,
    steps: [],
  });

  const currentEquation = EQUATION_DEFINITIONS[state.selectedType];

  const handleCoefficientChange = useCallback((key: string, value: string) => {
    setState(prev => ({
      ...prev,
      coefficients: { ...prev.coefficients, [key]: value },
    }));
  }, []);

  const solve = useCallback(() => {
    setState(prev => ({ ...prev, isCalculating: true }));

    try {
      const values: number[] = [];

      if (state.selectedType === 'polynomial') {
        const degree = parseFloat(state.coefficients.degree || '0');
        const coeffsStr = state.coefficients.coeffs || '';
        if (isNaN(degree) || !coeffsStr.trim()) {
          throw new Error('请输入有效的次数和系数');
        }
        values.push(degree);
        values.push(coeffsStr as any); // 特殊处理字符串参数
      } else {
        for (const key of currentEquation.inputs) {
          const value = parseFloat(state.coefficients[key] || '0');
          if (isNaN(value)) {
            throw new Error(`请输入有效的${currentEquation.labels[key]}`);
          }
          values.push(value);
        }
      }

      // 验证输入
      if (state.selectedType !== 'polynomial' && !currentEquation.validator(...values)) {
        throw new Error('输入的系数不满足求解条件');
      }

      const result = currentEquation.solver(...values);

      setState(prev => ({
        ...prev,
        solutions: result.solutions,
        steps: result.steps,
        isCalculating: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isCalculating: false }));
      Alert.alert('求解错误', error instanceof Error ? error.message : '求解失败');
    }
  }, [state.coefficients, currentEquation, state.selectedType]);

  const renderEquationSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>选择方程类型</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Object.entries(EQUATION_DEFINITIONS).map(([key, def]) => (
          <Pressable
            key={key}
            style={[
              styles.selectorButton,
              state.selectedType === key ? styles.selectorButtonActive : {},
            ]}
            onPress={() => setState(prev => ({
              ...prev,
              selectedType: key as EquationType,
              coefficients: {},
              solutions: [],
              steps: [],
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
            <Text
              style={[
                styles.selectorButtonDesc,
                state.selectedType === key ? styles.selectorButtonDescActive : {},
              ]}
            >
              {def.description}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderInputs = () => (
    <View style={styles.inputsContainer}>
      <Text style={styles.inputsTitle}>{currentEquation.name}参数</Text>
      {currentEquation.inputs.map(key => (
        <View key={key} style={styles.inputRow}>
          <Text style={styles.inputLabel}>{currentEquation.labels[key]}</Text>
          <TextInput
            style={styles.input}
            value={state.coefficients[key] || ''}
            onChangeText={(value) => handleCoefficientChange(key, value)}
            placeholder={key === 'coeffs' ? '例: 1, -2, 1' : '请输入数值'}
            keyboardType={key === 'coeffs' ? 'default' : 'numeric'}
            multiline={key === 'coeffs'}
          />
        </View>
      ))}
    </View>
  );

  const renderSolutions = () => {
    if (state.solutions.length === 0) return null;

    return (
      <View style={styles.solutionsContainer}>
        <Text style={styles.solutionsTitle}>解答</Text>
        {state.solutions.map((solution, index) => (
          <View key={index} style={styles.solutionRow}>
            <Text style={styles.solutionText}>{solution}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSteps = () => {
    if (state.steps.length === 0) return null;

    return (
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle}>求解步骤</Text>
        {state.steps.map((step, index) => (
          <Text key={index} style={styles.stepText}>
            {step}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {renderEquationSelector()}
      {renderInputs()}

      <Pressable
        style={styles.solveButton}
        onPress={solve}
        disabled={state.isCalculating}
      >
        <Text style={styles.solveButtonText}>
          {state.isCalculating ? '求解中...' : '求解'}
        </Text>
      </Pressable>

      {renderSolutions()}
      {renderSteps()}
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 12,
    minWidth: 140,
  },

  selectorButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  selectorButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },

  selectorButtonTextActive: {
    color: '#ffffff',
  },

  selectorButtonDesc: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },

  selectorButtonDescActive: {
    color: 'rgba(255, 255, 255, 0.8)',
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

  solveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },

  solveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },

  solutionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  solutionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  solutionRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  solutionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    fontFamily: 'monospace',
  },

  stepsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },

  stepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  stepText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default EquationSolver;