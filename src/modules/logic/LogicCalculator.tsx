/**
 * Logic Calculator Module
 *
 * 逻辑计算器模块，支持布尔代数运算和逻辑表达式计算
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
  Switch,
} from 'react-native';

import { MathUtils } from '@/utils/math';
import { ValidationUtils } from '@/utils/validation';

type LogicOperation = 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR' | 'IMPLY' | 'EQUIV';
type NumberBase = 'binary' | 'decimal' | 'hexadecimal' | 'octal';

interface LogicState {
  mode: 'boolean' | 'bitwise' | 'truthTable';
  expression: string;
  variables: Record<string, boolean>;
  result: string | boolean | null;
  currentBase: NumberBase;
  operand1: string;
  operand2: string;
  selectedOperation: LogicOperation;
  truthTable: Array<{ vars: Record<string, boolean>; result: boolean }>;
}

const LOGIC_OPERATIONS = {
  AND: { symbol: '∧', func: (a: boolean, b: boolean) => a && b, description: '逻辑与' },
  OR: { symbol: '∨', func: (a: boolean, b: boolean) => a || b, description: '逻辑或' },
  NOT: { symbol: '¬', func: (a: boolean) => !a, description: '逻辑非' },
  XOR: { symbol: '⊕', func: (a: boolean, b: boolean) => a !== b, description: '异或' },
  NAND: { symbol: '↑', func: (a: boolean, b: boolean) => !(a && b), description: '与非' },
  NOR: { symbol: '↓', func: (a: boolean, b: boolean) => !(a || b), description: '或非' },
  IMPLY: { symbol: '→', func: (a: boolean, b: boolean) => !a || b, description: '蕴含' },
  EQUIV: { symbol: '↔', func: (a: boolean, b: boolean) => a === b, description: '等价' },
};

const BITWISE_OPERATIONS = {
  AND: { symbol: '&', func: (a: number, b: number) => a & b },
  OR: { symbol: '|', func: (a: number, b: number) => a | b },
  NOT: { symbol: '~', func: (a: number) => ~a },
  XOR: { symbol: '^', func: (a: number, b: number) => a ^ b },
  LSHIFT: { symbol: '<<', func: (a: number, b: number) => a << b },
  RSHIFT: { symbol: '>>', func: (a: number, b: number) => a >> b },
};

export const LogicCalculator: React.FC = () => {
  const [state, setState] = useState<LogicState>({
    mode: 'boolean',
    expression: '',
    variables: { A: false, B: false, C: false },
    result: null,
    currentBase: 'binary',
    operand1: '',
    operand2: '',
    selectedOperation: 'AND',
    truthTable: [],
  });

  const parseNumber = useCallback((value: string, base: NumberBase): number => {
    switch (base) {
      case 'binary':
        return parseInt(value, 2);
      case 'decimal':
        return parseInt(value, 10);
      case 'hexadecimal':
        return parseInt(value, 16);
      case 'octal':
        return parseInt(value, 8);
      default:
        return 0;
    }
  }, []);

  const formatNumber = useCallback((value: number, base: NumberBase): string => {
    switch (base) {
      case 'binary':
        return value.toString(2);
      case 'decimal':
        return value.toString(10);
      case 'hexadecimal':
        return value.toString(16).toUpperCase();
      case 'octal':
        return value.toString(8);
      default:
        return '0';
    }
  }, []);

  const evaluateBooleanExpression = useCallback((expr: string, vars: Record<string, boolean>): boolean => {
    // 简化的布尔表达式求值器
    let expression = expr.toUpperCase();

    // 替换变量
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      expression = expression.replace(regex, value.toString().toUpperCase());
    });

    // 替换逻辑运算符
    expression = expression.replace(/AND/g, '&&');
    expression = expression.replace(/OR/g, '||');
    expression = expression.replace(/NOT/g, '!');
    expression = expression.replace(/TRUE/g, 'true');
    expression = expression.replace(/FALSE/g, 'false');

    try {
      // 注意：在实际应用中应该使用更安全的表达式求值方法
      return eval(expression);
    } catch (error) {
      throw new Error('表达式格式错误');
    }
  }, []);

  const calculateBooleanResult = useCallback(() => {
    try {
      if (state.expression.trim() === '') {
        Alert.alert('错误', '请输入布尔表达式');
        return;
      }

      const result = evaluateBooleanExpression(state.expression, state.variables);
      setState(prev => ({ ...prev, result }));
    } catch (error) {
      Alert.alert('计算错误', error instanceof Error ? error.message : '计算失败');
    }
  }, [state.expression, state.variables, evaluateBooleanExpression]);

  const calculateBitwiseResult = useCallback(() => {
    try {
      if (!state.operand1 || !state.operand2) {
        Alert.alert('错误', '请输入两个操作数');
        return;
      }

      const num1 = parseNumber(state.operand1, state.currentBase);
      const num2 = parseNumber(state.operand2, state.currentBase);

      if (isNaN(num1) || isNaN(num2)) {
        Alert.alert('错误', '操作数格式不正确');
        return;
      }

      const operation = BITWISE_OPERATIONS[state.selectedOperation as keyof typeof BITWISE_OPERATIONS];
      if (!operation) {
        Alert.alert('错误', '不支持的位运算操作');
        return;
      }

      const result = operation.func(num1, num2);
      const formattedResult = formatNumber(result, state.currentBase);

      setState(prev => ({ ...prev, result: formattedResult }));
    } catch (error) {
      Alert.alert('计算错误', error instanceof Error ? error.message : '计算失败');
    }
  }, [state.operand1, state.operand2, state.currentBase, state.selectedOperation, parseNumber, formatNumber]);

  const generateTruthTable = useCallback(() => {
    try {
      if (state.expression.trim() === '') {
        Alert.alert('错误', '请输入布尔表达式');
        return;
      }

      const variables = Object.keys(state.variables);
      const truthTable: Array<{ vars: Record<string, boolean>; result: boolean }> = [];

      // 生成所有可能的变量组合
      const combinations = Math.pow(2, variables.length);

      for (let i = 0; i < combinations; i++) {
        const vars: Record<string, boolean> = {};

        variables.forEach((variable, index) => {
          vars[variable] = Boolean((i >> (variables.length - 1 - index)) & 1);
        });

        try {
          const result = evaluateBooleanExpression(state.expression, vars);
          truthTable.push({ vars, result });
        } catch (error) {
          Alert.alert('表达式错误', '无法计算真值表');
          return;
        }
      }

      setState(prev => ({ ...prev, truthTable }));
    } catch (error) {
      Alert.alert('计算错误', error instanceof Error ? error.message : '生成真值表失败');
    }
  }, [state.expression, state.variables, evaluateBooleanExpression]);

  const handleVariableChange = useCallback((variable: string, value: boolean) => {
    setState(prev => ({
      ...prev,
      variables: { ...prev.variables, [variable]: value },
    }));
  }, []);

  const renderModeSelector = () => (
    <View style={styles.modeContainer}>
      <Text style={styles.modeTitle}>计算模式</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'boolean', name: '布尔运算' },
          { key: 'bitwise', name: '位运算' },
          { key: 'truthTable', name: '真值表' },
        ].map(mode => (
          <Pressable
            key={mode.key}
            style={[
              styles.modeButton,
              state.mode === mode.key ? styles.modeButtonActive : {},
            ]}
            onPress={() => setState(prev => ({
              ...prev,
              mode: mode.key as any,
              result: null,
              truthTable: [],
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

  const renderBooleanMode = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>布尔表达式计算</Text>

      <Text style={styles.inputLabel}>表达式 (支持 AND, OR, NOT 操作)</Text>
      <TextInput
        style={styles.expressionInput}
        value={state.expression}
        onChangeText={expr => setState(prev => ({ ...prev, expression: expr }))}
        placeholder="例: A AND B OR NOT C"
        multiline
      />

      <Text style={styles.inputLabel}>变量值</Text>
      <View style={styles.variablesContainer}>
        {Object.entries(state.variables).map(([variable, value]) => (
          <View key={variable} style={styles.variableRow}>
            <Text style={styles.variableLabel}>{variable}:</Text>
            <Switch
              value={value}
              onValueChange={newValue => handleVariableChange(variable, newValue)}
            />
            <Text style={styles.variableValue}>{value ? 'TRUE' : 'FALSE'}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.calculateButton} onPress={calculateBooleanResult}>
        <Text style={styles.calculateButtonText}>计算</Text>
      </Pressable>

      {typeof state.result === 'boolean' && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>结果:</Text>
          <Text style={[styles.resultValue, { color: state.result ? '#4CAF50' : '#F44336' }]}>
            {state.result ? 'TRUE' : 'FALSE'}
          </Text>
        </View>
      )}
    </View>
  );

  const renderBitwiseMode = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>位运算计算</Text>

      <Text style={styles.inputLabel}>数制</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'binary', name: '二进制' },
          { key: 'decimal', name: '十进制' },
          { key: 'hexadecimal', name: '十六进制' },
          { key: 'octal', name: '八进制' },
        ].map(base => (
          <Pressable
            key={base.key}
            style={[
              styles.baseButton,
              state.currentBase === base.key ? styles.baseButtonActive : {},
            ]}
            onPress={() => setState(prev => ({ ...prev, currentBase: base.key as NumberBase }))}
          >
            <Text
              style={[
                styles.baseButtonText,
                state.currentBase === base.key ? styles.baseButtonTextActive : {},
              ]}
            >
              {base.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.inputLabel}>操作数1</Text>
      <TextInput
        style={styles.input}
        value={state.operand1}
        onChangeText={value => setState(prev => ({ ...prev, operand1: value }))}
        placeholder={`输入${state.currentBase === 'binary' ? '二进制' : state.currentBase === 'hexadecimal' ? '十六进制' : state.currentBase === 'octal' ? '八进制' : '十进制'}数`}
      />

      <Text style={styles.inputLabel}>操作数2</Text>
      <TextInput
        style={styles.input}
        value={state.operand2}
        onChangeText={value => setState(prev => ({ ...prev, operand2: value }))}
        placeholder={`输入${state.currentBase === 'binary' ? '二进制' : state.currentBase === 'hexadecimal' ? '十六进制' : state.currentBase === 'octal' ? '八进制' : '十进制'}数`}
      />

      <Text style={styles.inputLabel}>运算符</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {Object.entries(BITWISE_OPERATIONS).map(([key, op]) => (
          <Pressable
            key={key}
            style={[
              styles.operationButton,
              state.selectedOperation === key ? styles.operationButtonActive : {},
            ]}
            onPress={() => setState(prev => ({ ...prev, selectedOperation: key as LogicOperation }))}
          >
            <Text
              style={[
                styles.operationButtonText,
                state.selectedOperation === key ? styles.operationButtonTextActive : {},
              ]}
            >
              {op.symbol}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.calculateButton} onPress={calculateBitwiseResult}>
        <Text style={styles.calculateButtonText}>计算</Text>
      </Pressable>

      {typeof state.result === 'string' && state.result !== null && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>结果:</Text>
          <Text style={styles.resultValue}>{state.result}</Text>
        </View>
      )}
    </View>
  );

  const renderTruthTableMode = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>真值表生成</Text>

      <Text style={styles.inputLabel}>布尔表达式</Text>
      <TextInput
        style={styles.expressionInput}
        value={state.expression}
        onChangeText={expr => setState(prev => ({ ...prev, expression: expr }))}
        placeholder="例: A AND B OR NOT C"
        multiline
      />

      <Pressable style={styles.calculateButton} onPress={generateTruthTable}>
        <Text style={styles.calculateButtonText}>生成真值表</Text>
      </Pressable>

      {state.truthTable.length > 0 && (
        <View style={styles.truthTableContainer}>
          <Text style={styles.truthTableTitle}>真值表</Text>
          <View style={styles.truthTableHeader}>
            {Object.keys(state.variables).map(variable => (
              <Text key={variable} style={styles.truthTableHeaderCell}>{variable}</Text>
            ))}
            <Text style={styles.truthTableHeaderCell}>结果</Text>
          </View>
          {state.truthTable.map((row, index) => (
            <View key={index} style={styles.truthTableRow}>
              {Object.entries(row.vars).map(([variable, value]) => (
                <Text key={variable} style={styles.truthTableCell}>
                  {value ? 'T' : 'F'}
                </Text>
              ))}
              <Text style={[styles.truthTableCell, { color: row.result ? '#4CAF50' : '#F44336' }]}>
                {row.result ? 'T' : 'F'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderCurrentMode = () => {
    switch (state.mode) {
      case 'boolean':
        return renderBooleanMode();
      case 'bitwise':
        return renderBitwiseMode();
      case 'truthTable':
        return renderTruthTableMode();
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {renderModeSelector()}
      {renderCurrentMode()}
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

  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },

  expressionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },

  variablesContainer: {
    marginVertical: 8,
  },

  variableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },

  variableLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    width: 30,
  },

  variableValue: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    minWidth: 60,
  },

  baseButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },

  baseButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  baseButtonText: {
    fontSize: 12,
    color: '#666',
  },

  baseButtonTextActive: {
    color: '#ffffff',
  },

  operationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },

  operationButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  operationButtonText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'monospace',
  },

  operationButtonTextActive: {
    color: '#ffffff',
  },

  calculateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },

  calculateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },

  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },

  resultLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },

  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    fontFamily: 'monospace',
  },

  truthTableContainer: {
    marginTop: 16,
  },

  truthTableTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },

  truthTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },

  truthTableHeaderCell: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },

  truthTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  truthTableCell: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'monospace',
  },
});

export default LogicCalculator;