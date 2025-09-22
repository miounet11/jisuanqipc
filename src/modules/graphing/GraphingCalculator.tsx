/**
 * Graphing Calculator Module
 *
 * 图形计算器模块，支持函数图形绘制和分析
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle } from 'react-native-svg';

import { GraphRenderer } from '@/services/GraphRenderer';
import { CalculatorService } from '@/services/CalculatorService';
import { StorageService } from '@/services/StorageService';
import { ValidationUtils } from '@/utils/validation';
import {
  Expression,
  Graph,
  CalculatorType,
  ExpressionType,
  FunctionType,
  Point3D,
  Range,
  GraphStyle,
  Viewport,
} from '@/types';

// 图形计算器状态
interface GraphingState {
  expression: string;
  currentGraph: Graph | null;
  graphList: Graph[];
  isCalculating: boolean;
  isError: boolean;
  viewport: Viewport;
  xRange: Range;
  yRange: Range;
  resolution: number;
  graphStyle: GraphStyle;
  showGrid: boolean;
  showAxes: boolean;
  specialPoints: any[];
}

// 预设函数
const PRESET_FUNCTIONS = [
  { label: 'y = x²', expression: 'x^2' },
  { label: 'y = sin(x)', expression: 'sin(x)' },
  { label: 'y = cos(x)', expression: 'cos(x)' },
  { label: 'y = ln(x)', expression: 'ln(x)' },
  { label: 'y = e^x', expression: 'exp(x)' },
  { label: 'y = √x', expression: 'sqrt(x)' },
];

const { width: screenWidth } = Dimensions.get('window');
const GRAPH_WIDTH = screenWidth - 32;
const GRAPH_HEIGHT = GRAPH_WIDTH * 0.75;

export const GraphingCalculator: React.FC = () => {
  // 状态管理
  const [state, setState] = useState<GraphingState>({
    expression: '',
    currentGraph: null,
    graphList: [],
    isCalculating: false,
    isError: false,
    viewport: {
      centerX: 0,
      centerY: 0,
      scaleX: 20,
      scaleY: 20,
      rotation: 0,
    },
    xRange: { min: -10, max: 10 },
    yRange: { min: -10, max: 10 },
    resolution: 200,
    graphStyle: {
      color: '#007AFF',
      lineWidth: 2,
      lineType: 'solid',
      showPoints: false,
      pointSize: 3,
    },
    showGrid: true,
    showAxes: true,
    specialPoints: [],
  });

  // 服务实例
  const graphRenderer = useRef(new GraphRenderer()).current;
  const calculatorService = useRef(new CalculatorService()).current;
  const storageService = useRef(new StorageService()).current;

  // 动画值
  const graphScaleAnim = useRef(new Animated.Value(1)).current;

  /**
   * 处理表达式输入
   */
  const handleExpressionChange = useCallback((text: string) => {
    setState(prev => ({ ...prev, expression: text, isError: false }));
  }, []);

  /**
   * 绘制图形
   */
  const plotGraph = useCallback(async () => {
    if (!state.expression.trim()) {
      Alert.alert('错误', '请输入函数表达式');
      return;
    }

    setState(prev => ({ ...prev, isCalculating: true, isError: false }));

    try {
      // 验证表达式
      const validation = ValidationUtils.validateExpression(
        state.expression,
        CalculatorType.GRAPHING
      );

      if (!validation.isValid) {
        throw new Error(validation.errors[0] || '表达式无效');
      }

      // 解析表达式
      const expression = await calculatorService.parseExpression(
        state.expression,
        CalculatorType.GRAPHING
      );

      // 渲染图形
      const renderOptions = {
        xRange: state.xRange,
        yRange: state.yRange,
        resolution: state.resolution,
        style: state.graphStyle,
        showGrid: state.showGrid,
        showAxes: state.showAxes,
      };

      const graph = await graphRenderer.render2D(expression, renderOptions);

      // 查找特殊点
      const specialPoints = await graphRenderer.findSpecialPoints(
        expression,
        state.xRange
      );

      // 保存图形
      await storageService.saveGraph(graph);

      setState(prev => ({
        ...prev,
        currentGraph: graph,
        graphList: [graph, ...prev.graphList.slice(0, 9)], // 保留最近10个
        specialPoints,
        isCalculating: false,
      }));

      // 动画效果
      Animated.sequence([
        Animated.timing(graphScaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(graphScaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

    } catch (error) {
      setState(prev => ({
        ...prev,
        isCalculating: false,
        isError: true,
      }));

      Alert.alert(
        '绘图错误',
        error instanceof Error ? error.message : '无法绘制图形'
      );
    }
  }, [state.expression, state.xRange, state.yRange, state.resolution, state.graphStyle, state.showGrid, state.showAxes, calculatorService, graphRenderer, storageService, graphScaleAnim]);

  /**
   * 清除图形
   */
  const clearGraph = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentGraph: null,
      specialPoints: [],
      expression: '',
    }));
  }, []);

  /**
   * 调整视口
   */
  const adjustViewport = useCallback((action: 'zoomIn' | 'zoomOut' | 'reset' | 'fitToView') => {
    setState(prev => {
      let newXRange = { ...prev.xRange };
      let newYRange = { ...prev.yRange };

      switch (action) {
        case 'zoomIn':
          const zoomInFactor = 0.8;
          const xCenter = (newXRange.min + newXRange.max) / 2;
          const yCenter = (newYRange.min + newYRange.max) / 2;
          const xSpan = (newXRange.max - newXRange.min) * zoomInFactor / 2;
          const ySpan = (newYRange.max - newYRange.min) * zoomInFactor / 2;

          newXRange = { min: xCenter - xSpan, max: xCenter + xSpan };
          newYRange = { min: yCenter - ySpan, max: yCenter + ySpan };
          break;

        case 'zoomOut':
          const zoomOutFactor = 1.25;
          const xCenterOut = (newXRange.min + newXRange.max) / 2;
          const yCenterOut = (newYRange.min + newYRange.max) / 2;
          const xSpanOut = (newXRange.max - newXRange.min) * zoomOutFactor / 2;
          const ySpanOut = (newYRange.max - newYRange.min) * zoomOutFactor / 2;

          newXRange = { min: xCenterOut - xSpanOut, max: xCenterOut + xSpanOut };
          newYRange = { min: yCenterOut - ySpanOut, max: yCenterOut + ySpanOut };
          break;

        case 'reset':
          newXRange = { min: -10, max: 10 };
          newYRange = { min: -10, max: 10 };
          break;

        case 'fitToView':
          if (prev.currentGraph) {
            // 根据图形点计算合适的范围
            const points = prev.currentGraph.points;
            if (points.length > 0) {
              const xs = points.map(p => p.x);
              const ys = points.map(p => p.y);
              const padding = 0.1;

              const xMin = Math.min(...xs);
              const xMax = Math.max(...xs);
              const yMin = Math.min(...ys);
              const yMax = Math.max(...ys);

              const xPadding = (xMax - xMin) * padding;
              const yPadding = (yMax - yMin) * padding;

              newXRange = { min: xMin - xPadding, max: xMax + xPadding };
              newYRange = { min: yMin - yPadding, max: yMax + yPadding };
            }
          }
          break;
      }

      return {
        ...prev,
        xRange: newXRange,
        yRange: newYRange,
      };
    });
  }, []);

  /**
   * 渲染SVG图形
   */
  const renderSVGGraph = useCallback(() => {
    if (!state.currentGraph) return null;

    const { points } = state.currentGraph;
    const { xRange, yRange } = state;

    // 坐标转换函数
    const toSVGX = (x: number) => ((x - xRange.min) / (xRange.max - xRange.min)) * GRAPH_WIDTH;
    const toSVGY = (y: number) => GRAPH_HEIGHT - ((y - yRange.min) / (yRange.max - yRange.min)) * GRAPH_HEIGHT;

    // 生成路径
    let pathData = '';
    if (points.length > 0) {
      pathData = points.reduce((path, point, index) => {
        const x = toSVGX(point.x);
        const y = toSVGY(point.y);

        if (index === 0) {
          return `M ${x} ${y}`;
        } else {
          return `${path} L ${x} ${y}`;
        }
      }, '');
    }

    // 网格线
    const gridLines = [];
    if (state.showGrid) {
      const gridStepX = (xRange.max - xRange.min) / 10;
      const gridStepY = (yRange.max - yRange.min) / 10;

      // 垂直网格线
      for (let i = 0; i <= 10; i++) {
        const x = toSVGX(xRange.min + i * gridStepX);
        gridLines.push(
          <Line
            key={`vgrid-${i}`}
            x1={x}
            y1={0}
            x2={x}
            y2={GRAPH_HEIGHT}
            stroke="#e0e0e0"
            strokeWidth={0.5}
          />
        );
      }

      // 水平网格线
      for (let i = 0; i <= 10; i++) {
        const y = toSVGY(yRange.min + i * gridStepY);
        gridLines.push(
          <Line
            key={`hgrid-${i}`}
            x1={0}
            y1={y}
            x2={GRAPH_WIDTH}
            y2={y}
            stroke="#e0e0e0"
            strokeWidth={0.5}
          />
        );
      }
    }

    // 坐标轴
    const axes = [];
    if (state.showAxes) {
      const xAxisY = toSVGY(0);
      const yAxisX = toSVGX(0);

      // X轴
      if (xAxisY >= 0 && xAxisY <= GRAPH_HEIGHT) {
        axes.push(
          <Line
            key="x-axis"
            x1={0}
            y1={xAxisY}
            x2={GRAPH_WIDTH}
            y2={xAxisY}
            stroke="#333"
            strokeWidth={2}
          />
        );
      }

      // Y轴
      if (yAxisX >= 0 && yAxisX <= GRAPH_WIDTH) {
        axes.push(
          <Line
            key="y-axis"
            x1={yAxisX}
            y1={0}
            x2={yAxisX}
            y2={GRAPH_HEIGHT}
            stroke="#333"
            strokeWidth={2}
          />
        );
      }
    }

    // 特殊点
    const specialPointElements = state.specialPoints.map((point, index) => (
      <Circle
        key={`special-${index}`}
        cx={toSVGX(point.position.x)}
        cy={toSVGY(point.position.y)}
        r={4}
        fill="#ff3b30"
        stroke="#ffffff"
        strokeWidth={2}
      />
    ));

    return (
      <Animated.View style={[{ transform: [{ scale: graphScaleAnim }] }]}>
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT} style={styles.svgGraph}>
          {gridLines}
          {axes}
          {pathData && (
            <Path
              d={pathData}
              stroke={state.graphStyle.color}
              strokeWidth={state.graphStyle.lineWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {specialPointElements}
        </Svg>
      </Animated.View>
    );
  }, [state.currentGraph, state.xRange, state.yRange, state.showGrid, state.showAxes, state.graphStyle, state.specialPoints, graphScaleAnim]);

  /**
   * 渲染预设函数按钮
   */
  const renderPresetButton = useCallback((preset: typeof PRESET_FUNCTIONS[0]) => (
    <Pressable
      key={preset.expression}
      style={styles.presetButton}
      onPress={() => handleExpressionChange(preset.expression)}
    >
      <Text style={styles.presetButtonText}>{preset.label}</Text>
    </Pressable>
  ), [handleExpressionChange]);

  /**
   * 渲染特殊点信息
   */
  const renderSpecialPoints = useCallback(() => {
    if (state.specialPoints.length === 0) return null;

    return (
      <View style={styles.specialPointsContainer}>
        <Text style={styles.specialPointsTitle}>特殊点</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {state.specialPoints.map((point, index) => (
            <View key={index} style={styles.specialPointItem}>
              <Text style={styles.specialPointType}>{point.type}</Text>
              <Text style={styles.specialPointCoords}>
                ({point.position.x.toFixed(3)}, {point.position.y.toFixed(3)})
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }, [state.specialPoints]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 输入区域 */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>函数表达式 (y = f(x))</Text>
        <TextInput
          style={[styles.input, state.isError ? styles.inputError : {}]}
          value={state.expression}
          onChangeText={handleExpressionChange}
          placeholder="例如: x^2, sin(x), ln(x)"
          placeholderTextColor="#999"
          multiline
          numberOfLines={2}
        />

        <View style={styles.inputActions}>
          <Pressable
            style={[styles.actionButton, styles.plotButton]}
            onPress={plotGraph}
            disabled={state.isCalculating}
          >
            <Text style={styles.actionButtonText}>
              {state.isCalculating ? '绘制中...' : '绘制图形'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.clearButton]}
            onPress={clearGraph}
          >
            <Text style={styles.actionButtonText}>清除</Text>
          </Pressable>
        </View>
      </View>

      {/* 预设函数 */}
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsTitle}>常用函数</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PRESET_FUNCTIONS.map(renderPresetButton)}
        </ScrollView>
      </View>

      {/* 图形显示区域 */}
      <View style={styles.graphContainer}>
        <View style={styles.graphHeader}>
          <Text style={styles.graphTitle}>函数图形</Text>
          <View style={styles.viewportControls}>
            <Pressable style={styles.controlButton} onPress={() => adjustViewport('zoomIn')}>
              <Text style={styles.controlButtonText}>+</Text>
            </Pressable>
            <Pressable style={styles.controlButton} onPress={() => adjustViewport('zoomOut')}>
              <Text style={styles.controlButtonText}>-</Text>
            </Pressable>
            <Pressable style={styles.controlButton} onPress={() => adjustViewport('reset')}>
              <Text style={styles.controlButtonText}>⌂</Text>
            </Pressable>
            <Pressable style={styles.controlButton} onPress={() => adjustViewport('fitToView')}>
              <Text style={styles.controlButtonText}>⤢</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.graphDisplay}>
          {renderSVGGraph()}

          {!state.currentGraph && (
            <View style={styles.emptyGraphPlaceholder}>
              <Text style={styles.emptyGraphText}>输入函数表达式并点击"绘制图形"</Text>
            </View>
          )}
        </View>

        {/* 坐标范围显示 */}
        <View style={styles.rangeDisplay}>
          <Text style={styles.rangeText}>
            X: [{state.xRange.min.toFixed(2)}, {state.xRange.max.toFixed(2)}]
          </Text>
          <Text style={styles.rangeText}>
            Y: [{state.yRange.min.toFixed(2)}, {state.yRange.max.toFixed(2)}]
          </Text>
        </View>
      </View>

      {/* 特殊点信息 */}
      {renderSpecialPoints()}

      {/* 图形选项 */}
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsTitle}>显示选项</Text>
        <View style={styles.optionRow}>
          <Pressable
            style={[styles.optionButton, state.showGrid ? styles.optionButtonActive : {}]}
            onPress={() => setState(prev => ({ ...prev, showGrid: !prev.showGrid }))}
          >
            <Text style={[styles.optionButtonText, state.showGrid ? styles.optionButtonTextActive : {}]}>
              网格
            </Text>
          </Pressable>

          <Pressable
            style={[styles.optionButton, state.showAxes ? styles.optionButtonActive : {}]}
            onPress={() => setState(prev => ({ ...prev, showAxes: !prev.showAxes }))}
          >
            <Text style={[styles.optionButtonText, state.showAxes ? styles.optionButtonTextActive : {}]}>
              坐标轴
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },

  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'monospace',
    minHeight: 60,
    textAlignVertical: 'top',
  },

  inputError: {
    borderColor: '#ff3b30',
  },

  inputActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },

  plotButton: {
    backgroundColor: '#007AFF',
  },

  clearButton: {
    backgroundColor: '#ff3b30',
  },

  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },

  presetsContainer: {
    marginBottom: 16,
  },

  presetsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },

  presetButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  presetButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'monospace',
  },

  graphContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  graphHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  graphTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  viewportControls: {
    flexDirection: 'row',
    gap: 8,
  },

  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },

  controlButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  graphDisplay: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    position: 'relative',
  },

  svgGraph: {
    backgroundColor: '#ffffff',
  },

  emptyGraphPlaceholder: {
    width: GRAPH_WIDTH,
    height: GRAPH_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },

  emptyGraphText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  rangeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },

  rangeText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },

  specialPointsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  specialPointsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  specialPointItem: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
  },

  specialPointType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginBottom: 2,
  },

  specialPointCoords: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },

  optionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  optionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },

  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },

  optionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  optionButtonText: {
    fontSize: 14,
    color: '#666',
  },

  optionButtonTextActive: {
    color: '#ffffff',
  },
});

export default GraphingCalculator;