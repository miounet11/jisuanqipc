/**
 * Expression Simplifier Module
 *
 * 表达式简化器模块，支持代数表达式的符号化简和展开
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

type OperationType = 'simplify' | 'expand' | 'factorize' | 'substitute' | 'derivative' | 'integrate';

interface ExpressionState {
  input: string;
  selectedOperation: OperationType;
  result: string;
  steps: string[];
  isProcessing: boolean;
  substitutions: Record<string, string>;
}

interface Term {
  coefficient: number;
  variables: Record<string, number>; // variable -> power
}

interface Expression {
  terms: Term[];
}

const OPERATIONS = {
  simplify: { name: '简化', description: '合并同类项，化简表达式' },
  expand: { name: '展开', description: '展开括号和乘积' },
  factorize: { name: '因式分解', description: '提取公因子，分解表达式' },
  substitute: { name: '代入', description: '将变量替换为数值或表达式' },
  derivative: { name: '求导', description: '对表达式求导数' },
  integrate: { name: '积分', description: '对表达式求不定积分' },
};

export const ExpressionSimplifier: React.FC = () => {
  const [state, setState] = useState<ExpressionState>({
    input: '',
    selectedOperation: 'simplify',
    result: '',
    steps: [],
    isProcessing: false,
    substitutions: {},
  });

  // 解析表达式为项的数组
  const parseExpression = useCallback((expr: string): Expression => {
    // 简化的表达式解析器
    const cleanExpr = expr.replace(/\s+/g, '').replace(/\-/g, '+-');
    const termStrings = cleanExpr.split('+').filter(t => t !== '');

    const terms: Term[] = [];

    for (const termStr of termStrings) {
      if (termStr.trim() === '') continue;

      const term: Term = {
        coefficient: 1,
        variables: {},
      };

      let remaining = termStr;

      // 提取系数
      const coeffMatch = remaining.match(/^[+-]?\d*\.?\d*/);
      if (coeffMatch && coeffMatch[0] !== '') {
        term.coefficient = parseFloat(coeffMatch[0]) || (coeffMatch[0] === '-' ? -1 : 1);
        remaining = remaining.substring(coeffMatch[0].length);
      }

      // 解析变量和指数
      const varMatches = remaining.matchAll(/([a-zA-Z]+)(\^(\d+))?/g);
      for (const match of varMatches) {
        const variable = match[1];
        const power = match[3] ? parseInt(match[3]) : 1;
        term.variables[variable] = (term.variables[variable] || 0) + power;
      }

      terms.push(term);
    }

    return { terms };
  }, []);

  // 将表达式转换为字符串
  const expressionToString = useCallback((expr: Expression): string => {
    if (expr.terms.length === 0) return '0';

    return expr.terms
      .map((term, index) => {
        let termStr = '';

        // 系数
        if (term.coefficient === 0) return '';

        if (index === 0) {
          if (term.coefficient === 1 && Object.keys(term.variables).length > 0) {
            termStr = '';
          } else if (term.coefficient === -1 && Object.keys(term.variables).length > 0) {
            termStr = '-';
          } else {
            termStr = term.coefficient.toString();
          }
        } else {
          if (term.coefficient > 0) {
            if (term.coefficient === 1 && Object.keys(term.variables).length > 0) {
              termStr = ' + ';
            } else {
              termStr = ` + ${term.coefficient}`;
            }
          } else {
            if (term.coefficient === -1 && Object.keys(term.variables).length > 0) {
              termStr = ' - ';
            } else {
              termStr = ` - ${Math.abs(term.coefficient)}`;
            }
          }
        }

        // 变量
        const varStr = Object.entries(term.variables)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([variable, power]) => {
            if (power === 0) return '';
            if (power === 1) return variable;
            return `${variable}^${power}`;
          })
          .filter(s => s !== '')
          .join('');

        return termStr + varStr;
      })
      .filter(s => s !== '')
      .join('');
  }, []);

  // 简化表达式
  const simplifyExpression = useCallback((expr: Expression): { result: Expression; steps: string[] } => {
    const steps: string[] = [];
    const termMap = new Map<string, Term>();

    steps.push('原表达式: ' + expressionToString(expr));

    // 合并同类项
    for (const term of expr.terms) {
      const varKey = Object.entries(term.variables)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([variable, power]) => `${variable}^${power}`)
        .join('');

      if (termMap.has(varKey)) {
        const existingTerm = termMap.get(varKey)!;
        existingTerm.coefficient += term.coefficient;
      } else {
        termMap.set(varKey, { ...term });
      }
    }

    // 移除系数为0的项
    const simplifiedTerms = Array.from(termMap.values()).filter(term => term.coefficient !== 0);

    const result: Expression = { terms: simplifiedTerms };
    steps.push('合并同类项: ' + expressionToString(result));

    return { result, steps };
  }, [expressionToString]);

  // 展开表达式（简化版本）
  const expandExpression = useCallback((input: string): { result: string; steps: string[] } => {
    const steps: string[] = [];
    steps.push('原表达式: ' + input);

    // 简化的展开逻辑
    let result = input;

    // 处理 (a+b)(c+d) 类型的展开
    const bracketPattern = /\(([^)]+)\)\s*\*?\s*\(([^)]+)\)/g;
    let match;

    while ((match = bracketPattern.exec(result)) !== null) {
      const [fullMatch, term1, term2] = match;
      const terms1 = term1.split(/\+|\-/).map(t => t.trim()).filter(t => t !== '');
      const terms2 = term2.split(/\+|\-/).map(t => t.trim()).filter(t => t !== '');

      const expandedTerms: string[] = [];
      for (const t1 of terms1) {
        for (const t2 of terms2) {
          expandedTerms.push(`(${t1})(${t2})`);
        }
      }

      const expanded = expandedTerms.join(' + ');
      result = result.replace(fullMatch, expanded);
      steps.push(`展开 ${fullMatch}: ${expanded}`);
    }

    steps.push('最终结果: ' + result);
    return { result, steps };
  }, []);

  // 求导数
  const differentiateExpression = useCallback((expr: Expression, variable: string = 'x'): { result: Expression; steps: string[] } => {
    const steps: string[] = [];
    steps.push(`对变量 ${variable} 求导`);
    steps.push('原表达式: ' + expressionToString(expr));

    const derivativeTerms: Term[] = [];

    for (const term of expr.terms) {
      const power = term.variables[variable] || 0;

      if (power === 0) {
        // 常数项的导数为0
        steps.push(`常数项 ${term.coefficient} 的导数为 0`);
        continue;
      }

      const newTerm: Term = {
        coefficient: term.coefficient * power,
        variables: { ...term.variables },
      };

      if (power === 1) {
        delete newTerm.variables[variable];
      } else {
        newTerm.variables[variable] = power - 1;
      }

      derivativeTerms.push(newTerm);

      const termStr = expressionToString({ terms: [term] });
      const derivativeStr = expressionToString({ terms: [newTerm] });
      steps.push(`${termStr} 的导数为 ${derivativeStr}`);
    }

    const result: Expression = { terms: derivativeTerms };
    steps.push('最终导数: ' + expressionToString(result));

    return { result, steps };
  }, [expressionToString]);

  // 积分
  const integrateExpression = useCallback((expr: Expression, variable: string = 'x'): { result: Expression; steps: string[] } => {
    const steps: string[] = [];
    steps.push(`对变量 ${variable} 求积分`);
    steps.push('原表达式: ' + expressionToString(expr));

    const integralTerms: Term[] = [];

    for (const term of expr.terms) {
      const power = term.variables[variable] || 0;

      if (power === -1) {
        steps.push(`${expressionToString({ terms: [term] })} 的积分为 ${term.coefficient}ln|${variable}|`);
        continue;
      }

      const newPower = power + 1;
      const newTerm: Term = {
        coefficient: term.coefficient / newPower,
        variables: { ...term.variables, [variable]: newPower },
      };

      integralTerms.push(newTerm);

      const termStr = expressionToString({ terms: [term] });
      const integralStr = expressionToString({ terms: [newTerm] });
      steps.push(`${termStr} 的积分为 ${integralStr}`);
    }

    const result: Expression = { terms: integralTerms };
    steps.push('最终积分: ' + expressionToString(result) + ' + C');

    return { result, steps };
  }, [expressionToString]);

  const processExpression = useCallback(() => {
    if (state.input.trim() === '') {
      Alert.alert('错误', '请输入表达式');
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      let result = '';
      let steps: string[] = [];

      switch (state.selectedOperation) {
        case 'simplify': {
          const expression = parseExpression(state.input);
          const simplified = simplifyExpression(expression);
          result = expressionToString(simplified.result);
          steps = simplified.steps;
          break;
        }

        case 'expand': {
          const expanded = expandExpression(state.input);
          result = expanded.result;
          steps = expanded.steps;
          break;
        }

        case 'derivative': {
          const expression = parseExpression(state.input);
          const derivative = differentiateExpression(expression);
          result = expressionToString(derivative.result);
          steps = derivative.steps;
          break;
        }

        case 'integrate': {
          const expression = parseExpression(state.input);
          const integral = integrateExpression(expression);
          result = expressionToString(integral.result) + ' + C';
          steps = integral.steps;
          break;
        }

        case 'factorize': {
          result = '因式分解功能正在开发中';
          steps = ['提取公因子', '寻找完全平方', '应用公式'];
          break;
        }

        case 'substitute': {
          result = '变量代入功能正在开发中';
          steps = ['识别变量', '应用代入', '计算结果'];
          break;
        }

        default:
          throw new Error('不支持的操作类型');
      }

      setState(prev => ({
        ...prev,
        result,
        steps,
        isProcessing: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isProcessing: false }));
      Alert.alert('处理错误', error instanceof Error ? error.message : '处理失败');
    }
  }, [state.input, state.selectedOperation, parseExpression, simplifyExpression, expressionToString, expandExpression, differentiateExpression, integrateExpression]);

  const renderOperationSelector = () => (
    <View style={styles.operationContainer}>
      <Text style={styles.operationTitle}>选择操作</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Object.entries(OPERATIONS).map(([key, op]) => (
          <Pressable
            key={key}
            style={[
              styles.operationButton,
              state.selectedOperation === key ? styles.operationButtonActive : {},
            ]}
            onPress={() => setState(prev => ({
              ...prev,
              selectedOperation: key as OperationType,
              result: '',
              steps: [],
            }))}
          >
            <Text
              style={[
                styles.operationButtonText,
                state.selectedOperation === key ? styles.operationButtonTextActive : {},
              ]}
            >
              {op.name}
            </Text>
            <Text
              style={[
                styles.operationButtonDesc,
                state.selectedOperation === key ? styles.operationButtonDescActive : {},
              ]}
            >
              {op.description}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputTitle}>输入表达式</Text>
      <TextInput
        style={styles.expressionInput}
        value={state.input}
        onChangeText={text => setState(prev => ({ ...prev, input: text }))}
        placeholder="例: 2x^2 + 3x - 1"
        multiline
      />
      <Text style={styles.inputHint}>
        支持变量 (a-z)、系数 (数字)、指数 (^)、基本运算 (+, -, *, /)
      </Text>
    </View>
  );

  const renderResult = () => {
    if (!state.result) return null;

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>结果</Text>
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{state.result}</Text>
        </View>
      </View>
    );
  };

  const renderSteps = () => {
    if (state.steps.length === 0) return null;

    return (
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle}>计算步骤</Text>
        {state.steps.map((step, index) => (
          <View key={index} style={styles.stepRow}>
            <Text style={styles.stepNumber}>{index + 1}.</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {renderOperationSelector()}
      {renderInput()}

      <Pressable
        style={styles.processButton}
        onPress={processExpression}
        disabled={state.isProcessing}
      >
        <Text style={styles.processButtonText}>
          {state.isProcessing ? '处理中...' : '处理表达式'}
        </Text>
      </Pressable>

      {renderResult()}
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

  operationContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  operationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  operationButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 12,
    minWidth: 120,
  },

  operationButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  operationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },

  operationButtonTextActive: {
    color: '#ffffff',
  },

  operationButtonDesc: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },

  operationButtonDescActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  inputTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  expressionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },

  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },

  processButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },

  processButtonText: {
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

  resultBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },

  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    fontFamily: 'monospace',
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

  stepRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },

  stepNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    width: 24,
    marginRight: 8,
  },

  stepText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});

export default ExpressionSimplifier;