/**
 * Binomial Expander Module
 *
 * 二项式展开器模块，支持二项式定理展开和帕斯卡三角形计算
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

type ExpansionMode = 'binomial' | 'trinomial' | 'pascal' | 'coefficient';

interface BinomialState {
  mode: ExpansionMode;
  termA: string;
  termB: string;
  termC: string;
  power: string;
  result: string;
  coefficients: number[];
  pascalTriangle: number[][];
  steps: string[];
  isCalculating: boolean;
}

interface BinomialTerm {
  coefficient: number;
  aExp: number;
  bExp: number;
  cExp?: number;
}

export const BinomialExpander: React.FC = () => {
  const [state, setState] = useState<BinomialState>({
    mode: 'binomial',
    termA: 'x',
    termB: 'y',
    termC: 'z',
    power: '3',
    result: '',
    coefficients: [],
    pascalTriangle: [],
    steps: [],
    isCalculating: false,
  });

  // 计算组合数 C(n, k)
  const combination = useCallback((n: number, k: number): number => {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;

    let result = 1;
    for (let i = 1; i <= k; i++) {
      result = result * (n - i + 1) / i;
    }
    return Math.round(result);
  }, []);

  // 生成帕斯卡三角形
  const generatePascalTriangle = useCallback((rows: number): number[][] => {
    const triangle: number[][] = [];

    for (let n = 0; n < rows; n++) {
      const row: number[] = [];
      for (let k = 0; k <= n; k++) {
        row.push(combination(n, k));
      }
      triangle.push(row);
    }

    return triangle;
  }, [combination]);

  // 二项式展开 (a + b)^n
  const expandBinomial = useCallback((a: string, b: string, n: number): { result: string; steps: string[]; coefficients: number[] } => {
    const steps: string[] = [];
    const coefficients: number[] = [];
    const terms: BinomialTerm[] = [];

    steps.push(`展开 (${a} + ${b})^${n}`);
    steps.push(`使用二项式定理: (a + b)^n = Σ(k=0 to n) C(n,k) * a^(n-k) * b^k`);

    for (let k = 0; k <= n; k++) {
      const coeff = combination(n, k);
      const aExp = n - k;
      const bExp = k;

      coefficients.push(coeff);
      terms.push({ coefficient: coeff, aExp, bExp });

      let termStr = '';
      if (coeff !== 1 || (aExp === 0 && bExp === 0)) {
        termStr += coeff.toString();
      }

      if (aExp > 0) {
        if (aExp === 1) {
          termStr += a;
        } else {
          termStr += `${a}^${aExp}`;
        }
      }

      if (bExp > 0) {
        if (bExp === 1) {
          termStr += b;
        } else {
          termStr += `${b}^${bExp}`;
        }
      }

      if (aExp === 0 && bExp === 0) {
        termStr = coeff.toString();
      }

      steps.push(`项 ${k + 1}: C(${n},${k}) * ${a}^${aExp} * ${b}^${bExp} = ${coeff} * ${a}^${aExp} * ${b}^${bExp} = ${termStr}`);
    }

    const result = terms.map((term, index) => {
      let termStr = '';

      if (index > 0) {
        termStr += ' + ';
      }

      if (term.coefficient !== 1 || (term.aExp === 0 && term.bExp === 0)) {
        termStr += term.coefficient.toString();
      }

      if (term.aExp > 0) {
        if (term.aExp === 1) {
          termStr += a;
        } else {
          termStr += `${a}^${term.aExp}`;
        }
      }

      if (term.bExp > 0) {
        if (term.bExp === 1) {
          termStr += b;
        } else {
          termStr += `${b}^${term.bExp}`;
        }
      }

      return termStr;
    }).join('');

    steps.push(`最终结果: ${result}`);

    return { result, steps, coefficients };
  }, [combination]);

  // 三项式展开 (a + b + c)^n (简化版本，仅支持小的n值)
  const expandTrinomial = useCallback((a: string, b: string, c: string, n: number): { result: string; steps: string[] } => {
    const steps: string[] = [];

    steps.push(`展开 (${a} + ${b} + ${c})^${n}`);

    if (n > 4) {
      return {
        result: '三项式展开仅支持 n ≤ 4 的情况',
        steps: ['三项式展开的完整实现需要多项式系数计算'],
      };
    }

    const terms: string[] = [];

    if (n === 0) {
      terms.push('1');
    } else if (n === 1) {
      terms.push(a, b, c);
    } else if (n === 2) {
      // (a+b+c)^2 = a^2 + b^2 + c^2 + 2ab + 2ac + 2bc
      terms.push(`${a}^2`, `${b}^2`, `${c}^2`, `2${a}${b}`, `2${a}${c}`, `2${b}${c}`);
    } else if (n === 3) {
      // (a+b+c)^3 = a^3 + b^3 + c^3 + 3a^2b + 3a^2c + 3b^2a + 3b^2c + 3c^2a + 3c^2b + 6abc
      terms.push(
        `${a}^3`, `${b}^3`, `${c}^3`,
        `3${a}^2${b}`, `3${a}^2${c}`, `3${b}^2${a}`, `3${b}^2${c}`, `3${c}^2${a}`, `3${c}^2${b}`,
        `6${a}${b}${c}`
      );
    } else if (n === 4) {
      // 简化的4次展开
      terms.push(`${a}^4`, `${b}^4`, `${c}^4`, '...(省略中间项)');
    }

    const result = terms.join(' + ');
    steps.push(`结果: ${result}`);

    return { result, steps };
  }, []);

  // 计算特定项的系数
  const getSpecificCoefficient = useCallback((n: number, k: number): { result: string; steps: string[] } => {
    const steps: string[] = [];
    steps.push(`计算 (a + b)^${n} 展开式中第 ${k + 1} 项的系数`);
    steps.push(`第 ${k + 1} 项的形式为: C(${n},${k}) * a^${n - k} * b^${k}`);

    const coeff = combination(n, k);
    steps.push(`C(${n},${k}) = ${n}! / (${k}! * ${n - k}!) = ${coeff}`);

    return {
      result: `第 ${k + 1} 项的系数为: ${coeff}`,
      steps,
    };
  }, [combination]);

  const calculate = useCallback(() => {
    setState(prev => ({ ...prev, isCalculating: true }));

    try {
      const power = parseInt(state.power);
      if (isNaN(power) || power < 0 || power > 20) {
        throw new Error('指数必须是0到20之间的整数');
      }

      let result = '';
      let steps: string[] = [];
      let coefficients: number[] = [];
      let pascalTriangle: number[][] = [];

      switch (state.mode) {
        case 'binomial': {
          if (!state.termA.trim() || !state.termB.trim()) {
            throw new Error('请输入项A和项B');
          }
          const expansion = expandBinomial(state.termA, state.termB, power);
          result = expansion.result;
          steps = expansion.steps;
          coefficients = expansion.coefficients;
          break;
        }

        case 'trinomial': {
          if (!state.termA.trim() || !state.termB.trim() || !state.termC.trim()) {
            throw new Error('请输入项A、项B和项C');
          }
          const expansion = expandTrinomial(state.termA, state.termB, state.termC, power);
          result = expansion.result;
          steps = expansion.steps;
          break;
        }

        case 'pascal': {
          pascalTriangle = generatePascalTriangle(power + 1);
          result = `生成了 ${power + 1} 行帕斯卡三角形`;
          steps = [`帕斯卡三角形的第 n 行对应 (a + b)^n 的系数`];
          break;
        }

        case 'coefficient': {
          const k = Math.floor(power / 2); // 示例：取中间项
          const coeff = getSpecificCoefficient(power, k);
          result = coeff.result;
          steps = coeff.steps;
          break;
        }

        default:
          throw new Error('不支持的计算模式');
      }

      setState(prev => ({
        ...prev,
        result,
        steps,
        coefficients,
        pascalTriangle,
        isCalculating: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isCalculating: false }));
      Alert.alert('计算错误', error instanceof Error ? error.message : '计算失败');
    }
  }, [state.mode, state.termA, state.termB, state.termC, state.power, expandBinomial, expandTrinomial, generatePascalTriangle, getSpecificCoefficient]);

  const renderModeSelector = () => (
    <View style={styles.modeContainer}>
      <Text style={styles.modeTitle}>计算模式</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'binomial', name: '二项式展开' },
          { key: 'trinomial', name: '三项式展开' },
          { key: 'pascal', name: '帕斯卡三角' },
          { key: 'coefficient', name: '系数计算' },
        ].map(mode => (
          <Pressable
            key={mode.key}
            style={[
              styles.modeButton,
              state.mode === mode.key ? styles.modeButtonActive : {},
            ]}
            onPress={() => setState(prev => ({
              ...prev,
              mode: mode.key as ExpansionMode,
              result: '',
              steps: [],
              coefficients: [],
              pascalTriangle: [],
            }))}
          >
            <Text
              style={[
                styles.modeButtonText,
                state.mode === mode.key ? styles.modeButtonTextActive : {},
              ]}
            >
              {mode.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderInputs = () => (
    <View style={styles.inputsContainer}>
      <Text style={styles.inputsTitle}>输入参数</Text>

      {(state.mode === 'binomial' || state.mode === 'trinomial') && (
        <>
          <Text style={styles.inputLabel}>项 A</Text>
          <TextInput
            style={styles.input}
            value={state.termA}
            onChangeText={text => setState(prev => ({ ...prev, termA: text }))}
            placeholder="例: x"
          />

          <Text style={styles.inputLabel}>项 B</Text>
          <TextInput
            style={styles.input}
            value={state.termB}
            onChangeText={text => setState(prev => ({ ...prev, termB: text }))}
            placeholder="例: y"
          />

          {state.mode === 'trinomial' && (
            <>
              <Text style={styles.inputLabel}>项 C</Text>
              <TextInput
                style={styles.input}
                value={state.termC}
                onChangeText={text => setState(prev => ({ ...prev, termC: text }))}
                placeholder="例: z"
              />
            </>
          )}
        </>
      )}

      <Text style={styles.inputLabel}>指数 n</Text>
      <TextInput
        style={styles.input}
        value={state.power}
        onChangeText={text => setState(prev => ({ ...prev, power: text }))}
        placeholder="输入指数 (0-20)"
        keyboardType="numeric"
      />
    </View>
  );

  const renderResult = () => {
    if (!state.result) return null;

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>结果</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <Text style={styles.resultText}>{state.result}</Text>
        </ScrollView>
      </View>
    );
  };

  const renderCoefficients = () => {
    if (state.coefficients.length === 0) return null;

    return (
      <View style={styles.coefficientsContainer}>
        <Text style={styles.coefficientsTitle}>二项式系数</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.coefficientsRow}>
            {state.coefficients.map((coeff, index) => (
              <View key={index} style={styles.coefficientItem}>
                <Text style={styles.coefficientIndex}>k={index}</Text>
                <Text style={styles.coefficientValue}>{coeff}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderPascalTriangle = () => {
    if (state.pascalTriangle.length === 0) return null;

    return (
      <View style={styles.pascalContainer}>
        <Text style={styles.pascalTitle}>帕斯卡三角形</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.pascalTriangle}>
            {state.pascalTriangle.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.pascalRow}>
                <Text style={styles.pascalRowLabel}>n={rowIndex}</Text>
                {row.map((value, colIndex) => (
                  <Text key={colIndex} style={styles.pascalValue}>
                    {value}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderSteps = () => {
    if (state.steps.length === 0) return null;

    return (
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle}>计算步骤</Text>
        {state.steps.map((step, index) => (
          <Text key={index} style={styles.stepText}>
            {index + 1}. {step}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {renderModeSelector()}
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

      {renderResult()}
      {renderCoefficients()}
      {renderPascalTriangle()}
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

  modeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  modeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },

  modeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  modeButtonText: {
    fontSize: 14,
    color: '#666',
  },

  modeButtonTextActive: {
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

  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
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

  resultContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  resultText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'monospace',
    lineHeight: 20,
  },

  coefficientsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  coefficientsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  coefficientsRow: {
    flexDirection: 'row',
  },

  coefficientItem: {
    alignItems: 'center',
    marginRight: 16,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    minWidth: 50,
  },

  coefficientIndex: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  coefficientValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  pascalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  pascalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  pascalTriangle: {
    alignItems: 'flex-start',
  },

  pascalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  pascalRowLabel: {
    fontSize: 12,
    color: '#666',
    width: 40,
    marginRight: 12,
  },

  pascalValue: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'monospace',
    marginRight: 12,
    minWidth: 30,
    textAlign: 'center',
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
    marginBottom: 8,
    fontFamily: 'monospace',
  },
});

export default BinomialExpander;