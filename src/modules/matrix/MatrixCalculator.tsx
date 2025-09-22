/**
 * Matrix Calculator Module
 *
 * 矩阵计算器模块，支持矩阵的基本运算和高级功能
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

type MatrixOperation = 'add' | 'subtract' | 'multiply' | 'transpose' | 'determinant' | 'inverse' | 'rank' | 'eigenvalues';

interface MatrixState {
  selectedOperation: MatrixOperation;
  matrixA: number[][];
  matrixB: number[][];
  result: number[][] | number | string;
  matrixARows: number;
  matrixACols: number;
  matrixBRows: number;
  matrixBCols: number;
  steps: string[];
  isCalculating: boolean;
  inputMode: 'manual' | 'preset';
}

const OPERATIONS = {
  add: { name: '矩阵加法', requiresTwo: true },
  subtract: { name: '矩阵减法', requiresTwo: true },
  multiply: { name: '矩阵乘法', requiresTwo: true },
  transpose: { name: '矩阵转置', requiresTwo: false },
  determinant: { name: '行列式', requiresTwo: false },
  inverse: { name: '逆矩阵', requiresTwo: false },
  rank: { name: '矩阵秩', requiresTwo: false },
  eigenvalues: { name: '特征值', requiresTwo: false },
};

const PRESET_MATRICES = {
  identity2: { name: '2x2单位矩阵', matrix: [[1, 0], [0, 1]] },
  identity3: { name: '3x3单位矩阵', matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] },
  zero2: { name: '2x2零矩阵', matrix: [[0, 0], [0, 0]] },
  example2: { name: '示例2x2', matrix: [[1, 2], [3, 4]] },
  example3: { name: '示例3x3', matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
};

export const MatrixCalculator: React.FC = () => {
  const [state, setState] = useState<MatrixState>({
    selectedOperation: 'add',
    matrixA: [[1, 2], [3, 4]],
    matrixB: [[5, 6], [7, 8]],
    result: [],
    matrixARows: 2,
    matrixACols: 2,
    matrixBRows: 2,
    matrixBCols: 2,
    steps: [],
    isCalculating: false,
    inputMode: 'manual',
  });

  // 创建空矩阵
  const createEmptyMatrix = useCallback((rows: number, cols: number): number[][] => {
    return Array(rows).fill(0).map(() => Array(cols).fill(0));
  }, []);

  // 矩阵加法
  const addMatrices = useCallback((a: number[][], b: number[][]): { result: number[][]; steps: string[] } => {
    const steps: string[] = [];
    steps.push('矩阵加法: A + B');

    if (a.length !== b.length || a[0].length !== b[0].length) {
      throw new Error('矩阵维度不匹配，无法相加');
    }

    const result = a.map((row, i) =>
      row.map((val, j) => {
        const sum = val + b[i][j];
        steps.push(`A[${i}][${j}] + B[${i}][${j}] = ${val} + ${b[i][j]} = ${sum}`);
        return sum;
      })
    );

    return { result, steps };
  }, []);

  // 矩阵减法
  const subtractMatrices = useCallback((a: number[][], b: number[][]): { result: number[][]; steps: string[] } => {
    const steps: string[] = [];
    steps.push('矩阵减法: A - B');

    if (a.length !== b.length || a[0].length !== b[0].length) {
      throw new Error('矩阵维度不匹配，无法相减');
    }

    const result = a.map((row, i) =>
      row.map((val, j) => {
        const diff = val - b[i][j];
        steps.push(`A[${i}][${j}] - B[${i}][${j}] = ${val} - ${b[i][j]} = ${diff}`);
        return diff;
      })
    );

    return { result, steps };
  }, []);

  // 矩阵乘法
  const multiplyMatrices = useCallback((a: number[][], b: number[][]): { result: number[][]; steps: string[] } => {
    const steps: string[] = [];
    steps.push('矩阵乘法: A × B');

    if (a[0].length !== b.length) {
      throw new Error('矩阵维度不匹配，A的列数必须等于B的行数');
    }

    const result = Array(a.length).fill(0).map(() => Array(b[0].length).fill(0));

    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b[0].length; j++) {
        let sum = 0;
        const terms: string[] = [];

        for (let k = 0; k < a[0].length; k++) {
          sum += a[i][k] * b[k][j];
          terms.push(`${a[i][k]}×${b[k][j]}`);
        }

        result[i][j] = sum;
        steps.push(`C[${i}][${j}] = ${terms.join(' + ')} = ${sum}`);
      }
    }

    return { result, steps };
  }, []);

  // 矩阵转置
  const transposeMatrix = useCallback((matrix: number[][]): { result: number[][]; steps: string[] } => {
    const steps: string[] = [];
    steps.push('矩阵转置: A^T');

    const result = Array(matrix[0].length).fill(0).map(() => Array(matrix.length).fill(0));

    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[0].length; j++) {
        result[j][i] = matrix[i][j];
        steps.push(`A^T[${j}][${i}] = A[${i}][${j}] = ${matrix[i][j]}`);
      }
    }

    return { result, steps };
  }, []);

  // 计算行列式（仅支持2x2和3x3）
  const calculateDeterminant = useCallback((matrix: number[][]): { result: number; steps: string[] } => {
    const steps: string[] = [];
    steps.push('计算行列式');

    if (matrix.length !== matrix[0].length) {
      throw new Error('只能计算方阵的行列式');
    }

    const n = matrix.length;

    if (n === 1) {
      return { result: matrix[0][0], steps: [`det(A) = ${matrix[0][0]}`] };
    }

    if (n === 2) {
      const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
      steps.push(`det(A) = a₁₁×a₂₂ - a₁₂×a₂₁`);
      steps.push(`det(A) = ${matrix[0][0]}×${matrix[1][1]} - ${matrix[0][1]}×${matrix[1][0]} = ${det}`);
      return { result: det, steps };
    }

    if (n === 3) {
      const det =
        matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
        matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
        matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

      steps.push('使用萨吕斯法则计算3x3行列式');
      steps.push(`det(A) = a₁₁(a₂₂a₃₃ - a₂₃a₃₂) - a₁₂(a₂₁a₃₃ - a₂₃a₃₁) + a₁₃(a₂₁a₃₂ - a₂₂a₃₁)`);
      steps.push(`det(A) = ${det}`);
      return { result: det, steps };
    }

    throw new Error('暂时只支持1x1、2x2和3x3矩阵的行列式计算');
  }, []);

  // 计算逆矩阵（仅支持2x2）
  const calculateInverse = useCallback((matrix: number[][]): { result: number[][]; steps: string[] } => {
    const steps: string[] = [];
    steps.push('计算逆矩阵');

    if (matrix.length !== matrix[0].length) {
      throw new Error('只能计算方阵的逆矩阵');
    }

    const n = matrix.length;

    if (n === 2) {
      const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

      if (Math.abs(det) < 1e-10) {
        throw new Error('矩阵不可逆（行列式为0）');
      }

      const result = [
        [matrix[1][1] / det, -matrix[0][1] / det],
        [-matrix[1][0] / det, matrix[0][0] / det]
      ];

      steps.push(`det(A) = ${det}`);
      steps.push('A⁻¹ = (1/det(A)) × adj(A)');
      steps.push(`A⁻¹ = (1/${det}) × [[${matrix[1][1]}, ${-matrix[0][1]}], [${-matrix[1][0]}, ${matrix[0][0]}]]`);

      return { result, steps };
    }

    throw new Error('暂时只支持2x2矩阵的逆矩阵计算');
  }, []);

  // 计算矩阵的秩
  const calculateRank = useCallback((matrix: number[][]): { result: number; steps: string[] } => {
    const steps: string[] = [];
    steps.push('计算矩阵的秩（使用高斯消元法）');

    // 复制矩阵以避免修改原矩阵
    const m = matrix.map(row => [...row]);
    const rows = m.length;
    const cols = m[0].length;
    let rank = 0;

    for (let col = 0; col < cols && rank < rows; col++) {
      // 寻找主元
      let pivotRow = -1;
      for (let row = rank; row < rows; row++) {
        if (Math.abs(m[row][col]) > 1e-10) {
          pivotRow = row;
          break;
        }
      }

      if (pivotRow === -1) continue;

      // 交换行
      if (pivotRow !== rank) {
        [m[rank], m[pivotRow]] = [m[pivotRow], m[rank]];
        steps.push(`交换第${rank + 1}行和第${pivotRow + 1}行`);
      }

      // 消元
      for (let row = rank + 1; row < rows; row++) {
        if (Math.abs(m[row][col]) > 1e-10) {
          const factor = m[row][col] / m[rank][col];
          for (let c = col; c < cols; c++) {
            m[row][c] -= factor * m[rank][c];
          }
          steps.push(`第${row + 1}行消元`);
        }
      }

      rank++;
    }

    steps.push(`矩阵的秩为: ${rank}`);
    return { result: rank, steps };
  }, []);

  const calculate = useCallback(() => {
    setState(prev => ({ ...prev, isCalculating: true }));

    try {
      let result: number[][] | number | string = [];
      let steps: string[] = [];

      switch (state.selectedOperation) {
        case 'add': {
          const res = addMatrices(state.matrixA, state.matrixB);
          result = res.result;
          steps = res.steps;
          break;
        }

        case 'subtract': {
          const res = subtractMatrices(state.matrixA, state.matrixB);
          result = res.result;
          steps = res.steps;
          break;
        }

        case 'multiply': {
          const res = multiplyMatrices(state.matrixA, state.matrixB);
          result = res.result;
          steps = res.steps;
          break;
        }

        case 'transpose': {
          const res = transposeMatrix(state.matrixA);
          result = res.result;
          steps = res.steps;
          break;
        }

        case 'determinant': {
          const res = calculateDeterminant(state.matrixA);
          result = res.result;
          steps = res.steps;
          break;
        }

        case 'inverse': {
          const res = calculateInverse(state.matrixA);
          result = res.result;
          steps = res.steps;
          break;
        }

        case 'rank': {
          const res = calculateRank(state.matrixA);
          result = res.result;
          steps = res.steps;
          break;
        }

        case 'eigenvalues': {
          result = '特征值计算功能正在开发中';
          steps = ['需要复杂的数值算法来计算特征值'];
          break;
        }

        default:
          throw new Error('不支持的操作类型');
      }

      setState(prev => ({
        ...prev,
        result,
        steps,
        isCalculating: false,
      }));
    } catch (error) {
      setState(prev => ({ ...prev, isCalculating: false }));
      Alert.alert('计算错误', error instanceof Error ? error.message : '计算失败');
    }
  }, [state.selectedOperation, state.matrixA, state.matrixB, addMatrices, subtractMatrices, multiplyMatrices, transposeMatrix, calculateDeterminant, calculateInverse, calculateRank]);

  const updateMatrixValue = useCallback((matrix: 'A' | 'B', row: number, col: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setState(prev => ({
      ...prev,
      [matrix === 'A' ? 'matrixA' : 'matrixB']: prev[matrix === 'A' ? 'matrixA' : 'matrixB'].map((r, i) =>
        i === row ? r.map((c, j) => (j === col ? numValue : c)) : r
      ),
    }));
  }, []);

  const resizeMatrix = useCallback((matrix: 'A' | 'B', newRows: number, newCols: number) => {
    const newMatrix = createEmptyMatrix(newRows, newCols);
    const oldMatrix = matrix === 'A' ? state.matrixA : state.matrixB;

    // 复制现有值
    for (let i = 0; i < Math.min(newRows, oldMatrix.length); i++) {
      for (let j = 0; j < Math.min(newCols, oldMatrix[0].length); j++) {
        newMatrix[i][j] = oldMatrix[i][j];
      }
    }

    setState(prev => ({
      ...prev,
      [matrix === 'A' ? 'matrixA' : 'matrixB']: newMatrix,
      [matrix === 'A' ? 'matrixARows' : 'matrixBRows']: newRows,
      [matrix === 'A' ? 'matrixACols' : 'matrixBCols']: newCols,
    }));
  }, [createEmptyMatrix, state.matrixA, state.matrixB]);

  const loadPresetMatrix = useCallback((matrix: 'A' | 'B', presetKey: keyof typeof PRESET_MATRICES) => {
    const preset = PRESET_MATRICES[presetKey];
    setState(prev => ({
      ...prev,
      [matrix === 'A' ? 'matrixA' : 'matrixB']: preset.matrix.map(row => [...row]),
      [matrix === 'A' ? 'matrixARows' : 'matrixBRows']: preset.matrix.length,
      [matrix === 'A' ? 'matrixACols' : 'matrixBCols']: preset.matrix[0].length,
    }));
  }, []);

  const renderOperationSelector = () => (
    <View style={styles.operationContainer}>
      <Text style={styles.operationTitle}>矩阵运算</Text>
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
              selectedOperation: key as MatrixOperation,
              result: [],
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
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderMatrixInput = (matrix: 'A' | 'B', title: string) => {
    const currentMatrix = matrix === 'A' ? state.matrixA : state.matrixB;
    const rows = matrix === 'A' ? state.matrixARows : state.matrixBRows;
    const cols = matrix === 'A' ? state.matrixACols : state.matrixBCols;

    return (
      <View style={styles.matrixContainer}>
        <Text style={styles.matrixTitle}>{title}</Text>

        <View style={styles.matrixControls}>
          <Text style={styles.controlLabel}>行数:</Text>
          <TextInput
            style={styles.sizeInput}
            value={rows.toString()}
            onChangeText={text => {
              const newRows = Math.max(1, Math.min(5, parseInt(text) || 1));
              resizeMatrix(matrix, newRows, cols);
            }}
            keyboardType="numeric"
          />
          <Text style={styles.controlLabel}>列数:</Text>
          <TextInput
            style={styles.sizeInput}
            value={cols.toString()}
            onChangeText={text => {
              const newCols = Math.max(1, Math.min(5, parseInt(text) || 1));
              resizeMatrix(matrix, rows, newCols);
            }}
            keyboardType="numeric"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.matrixGrid}>
            {currentMatrix.map((row, i) => (
              <View key={i} style={styles.matrixRow}>
                {row.map((cell, j) => (
                  <TextInput
                    key={`${i}-${j}`}
                    style={styles.matrixCell}
                    value={cell.toString()}
                    onChangeText={value => updateMatrixValue(matrix, i, j, value)}
                    keyboardType="numeric"
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.presetContainer}>
            <Text style={styles.presetLabel}>预设矩阵:</Text>
            {Object.entries(PRESET_MATRICES).map(([key, preset]) => (
              <Pressable
                key={key}
                style={styles.presetButton}
                onPress={() => loadPresetMatrix(matrix, key as keyof typeof PRESET_MATRICES)}
              >
                <Text style={styles.presetButtonText}>{preset.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderResult = () => {
    if (!state.result && state.result !== 0) return null;

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>计算结果</Text>
        {typeof state.result === 'number' ? (
          <Text style={styles.scalarResult}>{state.result}</Text>
        ) : typeof state.result === 'string' ? (
          <Text style={styles.stringResult}>{state.result}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.resultMatrix}>
              {(state.result as number[][]).map((row, i) => (
                <View key={i} style={styles.resultRow}>
                  {row.map((cell, j) => (
                    <Text key={`${i}-${j}`} style={styles.resultCell}>
                      {typeof cell === 'number' ? cell.toFixed(4) : cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    );
  };

  const renderSteps = () => {
    if (state.steps.length === 0) return null;

    return (
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle}>计算步骤</Text>
        <ScrollView style={styles.stepsScroll}>
          {state.steps.map((step, index) => (
            <Text key={index} style={styles.stepText}>
              {index + 1}. {step}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  };

  const currentOperation = OPERATIONS[state.selectedOperation];

  return (
    <ScrollView style={styles.container}>
      {renderOperationSelector()}
      {renderMatrixInput('A', '矩阵 A')}
      {currentOperation.requiresTwo && renderMatrixInput('B', '矩阵 B')}

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
    fontSize: 14,
    color: '#666',
  },

  operationButtonTextActive: {
    color: '#ffffff',
  },

  matrixContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },

  matrixTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  matrixControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  controlLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },

  sizeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 6,
    fontSize: 14,
    width: 40,
    textAlign: 'center',
    marginRight: 16,
  },

  matrixGrid: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
  },

  matrixRow: {
    flexDirection: 'row',
  },

  matrixCell: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    margin: 2,
    width: 60,
    textAlign: 'center',
    fontSize: 14,
    backgroundColor: '#ffffff',
  },

  presetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  presetLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },

  presetButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#e9ecef',
    marginRight: 8,
  },

  presetButtonText: {
    fontSize: 11,
    color: '#495057',
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

  scalarResult: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    fontFamily: 'monospace',
  },

  stringResult: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  resultMatrix: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f0f8ff',
  },

  resultRow: {
    flexDirection: 'row',
  },

  resultCell: {
    padding: 8,
    margin: 2,
    minWidth: 80,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#007AFF',
    fontWeight: '500',
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

  stepsScroll: {
    maxHeight: 200,
  },

  stepText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default MatrixCalculator;