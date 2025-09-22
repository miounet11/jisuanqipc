/**
 * Graph Rendering Integration Test
 *
 * 图形渲染集成测试
 */

import { GraphRenderer } from '@/services/GraphRenderer';
import { Expression } from '@/models/Expression';
import { Graph } from '@/models/Graph';

describe('Graph Rendering Integration', () => {
  let graphRenderer: GraphRenderer;

  beforeAll(() => {
    graphRenderer = new GraphRenderer();
  });

  beforeEach(() => {
    // 重置图形渲染器状态
    graphRenderer.reset();
  });

  describe('Basic Function Plotting', () => {
    test('should plot linear function correctly', async () => {
      const expression = Expression.create('2*x + 1');
      const graph = await graphRenderer.plotFunction(expression, {
        xMin: -10,
        xMax: 10,
        yMin: -20,
        yMax: 20,
        step: 0.1,
      });

      expect(graph.isValid).toBe(true);
      expect(graph.points.length).toBeGreaterThan(0);

      // 验证线性函数的特性
      const firstPoint = graph.points[0];
      const lastPoint = graph.points[graph.points.length - 1];

      // 斜率应该约为2
      const slope = (lastPoint.y - firstPoint.y) / (lastPoint.x - firstPoint.x);
      expect(slope).toBeCloseTo(2, 1);
    });

    test('should plot quadratic function correctly', async () => {
      const expression = Expression.create('x^2');
      const graph = await graphRenderer.plotFunction(expression, {
        xMin: -5,
        xMax: 5,
        yMin: -1,
        yMax: 25,
        step: 0.1,
      });

      expect(graph.isValid).toBe(true);
      expect(graph.points.length).toBeGreaterThan(0);

      // 验证抛物线的对称性
      const centerIndex = Math.floor(graph.points.length / 2);
      const centerPoint = graph.points[centerIndex];

      // 中心点应该在原点附近的最低点
      expect(centerPoint.x).toBeCloseTo(0, 1);
      expect(centerPoint.y).toBeCloseTo(0, 1);
    });

    test('should plot trigonometric function correctly', async () => {
      const expression = Expression.create('sin(x)');
      const graph = await graphRenderer.plotFunction(expression, {
        xMin: -Math.PI * 2,
        xMax: Math.PI * 2,
        yMin: -2,
        yMax: 2,
        step: 0.1,
      });

      expect(graph.isValid).toBe(true);
      expect(graph.points.length).toBeGreaterThan(0);

      // 验证正弦函数的周期性
      const foundZeros = graph.points.filter(p => Math.abs(p.y) < 0.1);
      expect(foundZeros.length).toBeGreaterThan(3); // 应该有多个零点
    });

    test('should plot exponential function correctly', async () => {
      const expression = Expression.create('exp(x)');
      const graph = await graphRenderer.plotFunction(expression, {
        xMin: -2,
        xMax: 2,
        yMin: 0,
        yMax: 10,
        step: 0.1,
      });

      expect(graph.isValid).toBe(true);
      expect(graph.points.length).toBeGreaterThan(0);

      // 验证指数函数的单调性
      for (let i = 1; i < graph.points.length; i++) {
        expect(graph.points[i].y).toBeGreaterThanOrEqual(graph.points[i - 1].y);
      }
    });
  });

  describe('Multiple Function Plotting', () => {
    test('should plot multiple functions simultaneously', async () => {
      const expressions = [
        Expression.create('x'),
        Expression.create('x^2'),
        Expression.create('x^3'),
      ];

      const graphs = await Promise.all(
        expressions.map(expr => graphRenderer.plotFunction(expr, {
          xMin: -2,
          xMax: 2,
          yMin: -8,
          yMax: 8,
          step: 0.1,
        }))
      );

      expect(graphs.length).toBe(3);
      graphs.forEach(graph => {
        expect(graph.isValid).toBe(true);
        expect(graph.points.length).toBeGreaterThan(0);
      });

      // 验证在x=1处的函数值
      graphs.forEach((graph, index) => {
        const pointAtOne = graph.points.find(p => Math.abs(p.x - 1) < 0.1);
        if (pointAtOne) {
          expect(pointAtOne.y).toBeCloseTo(Math.pow(1, index + 1), 1);
        }
      });
    });

    test('should handle overlapping functions', async () => {
      const expressions = [
        Expression.create('sin(x)'),
        Expression.create('cos(x)'),
      ];

      const graphs = await Promise.all(
        expressions.map(expr => graphRenderer.plotFunction(expr, {
          xMin: -Math.PI,
          xMax: Math.PI,
          yMin: -2,
          yMax: 2,
          step: 0.05,
        }))
      );

      expect(graphs.length).toBe(2);

      // 验证sin和cos的相位关系
      const sinGraph = graphs[0];
      const cosGraph = graphs[1];

      // 在x=0处，sin(0)=0，cos(0)=1
      const sinAtZero = sinGraph.points.find(p => Math.abs(p.x) < 0.1);
      const cosAtZero = cosGraph.points.find(p => Math.abs(p.x) < 0.1);

      if (sinAtZero && cosAtZero) {
        expect(sinAtZero.y).toBeCloseTo(0, 1);
        expect(cosAtZero.y).toBeCloseTo(1, 1);
      }
    });
  });

  describe('Special Points Detection', () => {
    test('should detect zeros correctly', async () => {
      const expression = Expression.create('x^2 - 4');
      const graph = await graphRenderer.plotFunction(expression, {
        xMin: -5,
        xMax: 5,
        yMin: -5,
        yMax: 21,
        step: 0.1,
      });

      const zeros = graphRenderer.findZeros(graph);

      expect(zeros.length).toBeGreaterThanOrEqual(2);
      // 零点应该在x=±2附近
      expect(zeros.some(z => Math.abs(z.x - 2) < 0.2)).toBe(true);
      expect(zeros.some(z => Math.abs(z.x + 2) < 0.2)).toBe(true);
    });

    test('should detect extrema correctly', async () => {
      const expression = Expression.create('x^3 - 3*x');
      const graph = await graphRenderer.plotFunction(expression, {
        xMin: -3,
        xMax: 3,
        yMin: -3,
        yMax: 3,
        step: 0.05,
      });

      const extrema = graphRenderer.findExtrema(graph);

      expect(extrema.length).toBeGreaterThanOrEqual(2);
      // 应该有一个最大值和一个最小值
      expect(extrema.some(e => e.type === 'maximum')).toBe(true);
      expect(extrema.some(e => e.type === 'minimum')).toBe(true);
    });

    test('should detect inflection points', async () => {
      const expression = Expression.create('x^3');
      const graph = await graphRenderer.plotFunction(expression, {
        xMin: -2,
        xMax: 2,
        yMin: -8,
        yMax: 8,
        step: 0.05,
      });

      const inflectionPoints = graphRenderer.findInflectionPoints(graph);

      expect(inflectionPoints.length).toBeGreaterThanOrEqual(1);
      // 应该在原点附近有一个拐点
      expect(inflectionPoints.some(p => Math.abs(p.x) < 0.2 && Math.abs(p.y) < 0.2)).toBe(true);
    });
  });

  describe('Viewport and Scaling', () => {
    test('should handle different viewport sizes', async () => {
      const expression = Expression.create('x^2');

      const viewports = [
        { xMin: -1, xMax: 1, yMin: 0, yMax: 1 },
        { xMin: -10, xMax: 10, yMin: 0, yMax: 100 },
        { xMin: -100, xMax: 100, yMin: 0, yMax: 10000 },
      ];

      for (const viewport of viewports) {
        const graph = await graphRenderer.plotFunction(expression, {
          ...viewport,
          step: (viewport.xMax - viewport.xMin) / 100,
        });

        expect(graph.isValid).toBe(true);
        expect(graph.points.length).toBeGreaterThan(0);

        // 所有点都应该在视口范围内
        graph.points.forEach(point => {
          expect(point.x).toBeGreaterThanOrEqual(viewport.xMin);
          expect(point.x).toBeLessThanOrEqual(viewport.xMax);
          expect(point.y).toBeGreaterThanOrEqual(viewport.yMin);
          expect(point.y).toBeLessThanOrEqual(viewport.yMax);
        });
      }
    });

    test('should handle zooming operations', async () => {
      const expression = Expression.create('sin(x)');

      // 初始视图
      const initialGraph = await graphRenderer.plotFunction(expression, {
        xMin: -Math.PI,
        xMax: Math.PI,
        yMin: -2,
        yMax: 2,
        step: 0.1,
      });

      // 放大视图
      const zoomedGraph = await graphRenderer.plotFunction(expression, {
        xMin: -Math.PI / 2,
        xMax: Math.PI / 2,
        yMin: -1.5,
        yMax: 1.5,
        step: 0.05,
      });

      expect(initialGraph.points.length).toBeGreaterThan(0);
      expect(zoomedGraph.points.length).toBeGreaterThan(0);

      // 放大后的图形应该有更高的分辨率
      const initialDensity = initialGraph.points.length / (2 * Math.PI);
      const zoomedDensity = zoomedGraph.points.length / Math.PI;

      expect(zoomedDensity).toBeGreaterThan(initialDensity);
    });
  });

  describe('Error Handling', () => {
    test('should handle undefined functions gracefully', async () => {
      const expression = Expression.create('1/x');
      const graph = await graphRenderer.plotFunction(expression, {
        xMin: -2,
        xMax: 2,
        yMin: -10,
        yMax: 10,
        step: 0.1,
      });

      // 函数在x=0处未定义，但应该能够绘制其他点
      expect(graph.isValid).toBe(true);
      expect(graph.points.length).toBeGreaterThan(0);

      // 不应该有x=0的点
      expect(graph.points.some(p => Math.abs(p.x) < 0.05)).toBe(false);
    });

    test('should handle complex-valued functions', async () => {
      const expression = Expression.create('sqrt(x)');
      const graph = await graphRenderer.plotFunction(expression, {
        xMin: -2,
        xMax: 4,
        yMin: -1,
        yMax: 3,
        step: 0.1,
      });

      // 应该只绘制x>=0的部分
      expect(graph.isValid).toBe(true);
      graph.points.forEach(point => {
        expect(point.x).toBeGreaterThanOrEqual(0);
      });
    });

    test('should handle infinite values', async () => {
      const expression = Expression.create('tan(x)');
      const graph = await graphRenderer.plotFunction(expression, {
        xMin: -Math.PI,
        xMax: Math.PI,
        yMin: -10,
        yMax: 10,
        step: 0.05,
      });

      expect(graph.isValid).toBe(true);

      // 应该在渐近线附近中断
      const asymptotes = [Math.PI / 2, -Math.PI / 2];
      asymptotes.forEach(asymptote => {
        const nearAsymptote = graph.points.filter(p =>
          Math.abs(p.x - asymptote) < 0.1
        );
        // 渐近线附近应该没有点或者y值很大
        nearAsymptote.forEach(point => {
          expect(Math.abs(point.y)).toBeLessThan(20);
        });
      });
    });
  });

  describe('Performance Tests', () => {
    test('should render simple functions quickly', async () => {
      const startTime = Date.now();

      const expression = Expression.create('x^2 + 2*x + 1');
      await graphRenderer.plotFunction(expression, {
        xMin: -100,
        xMax: 100,
        yMin: -10,
        yMax: 10000,
        step: 0.1,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 简单函数的绘制应该在500ms内完成
      expect(duration).toBeLessThan(500);
    });

    test('should handle high-resolution plotting', async () => {
      const startTime = Date.now();

      const expression = Expression.create('sin(10*x)');
      await graphRenderer.plotFunction(expression, {
        xMin: -Math.PI,
        xMax: Math.PI,
        yMin: -2,
        yMax: 2,
        step: 0.01, // 高分辨率
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 高分辨率绘制应该在2秒内完成
      expect(duration).toBeLessThan(2000);
    });

    test('should handle multiple concurrent plots', async () => {
      const startTime = Date.now();

      const expressions = [
        'x',
        'x^2',
        'x^3',
        'sin(x)',
        'cos(x)',
        'exp(x/5)',
        'ln(x+10)',
      ].map(expr => Expression.create(expr));

      const plotPromises = expressions.map(expr =>
        graphRenderer.plotFunction(expr, {
          xMin: -5,
          xMax: 5,
          yMin: -10,
          yMax: 10,
          step: 0.1,
        })
      );

      const graphs = await Promise.all(plotPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 并发绘制多个函数应该在3秒内完成
      expect(duration).toBeLessThan(3000);

      // 所有图形都应该有效
      graphs.forEach(graph => {
        expect(graph.isValid).toBe(true);
        expect(graph.points.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Graph Data Export', () => {
    test('should export graph data correctly', async () => {
      const expression = Expression.create('x^2');
      const graph = await graphRenderer.plotFunction(expression, {
        xMin: -2,
        xMax: 2,
        yMin: 0,
        yMax: 4,
        step: 0.5,
      });

      const exportedData = graphRenderer.exportGraphData(graph);

      expect(exportedData).toBeDefined();
      expect(exportedData.points).toBeDefined();
      expect(exportedData.metadata).toBeDefined();
      expect(exportedData.metadata.expression).toBe('x^2');
      expect(exportedData.points.length).toBe(graph.points.length);
    });

    test('should import graph data correctly', async () => {
      const originalExpression = Expression.create('2*x + 1');
      const originalGraph = await graphRenderer.plotFunction(originalExpression, {
        xMin: -1,
        xMax: 1,
        yMin: -1,
        yMax: 3,
        step: 0.25,
      });

      const exportedData = graphRenderer.exportGraphData(originalGraph);
      const importedGraph = graphRenderer.importGraphData(exportedData);

      expect(importedGraph.isValid).toBe(true);
      expect(importedGraph.points.length).toBe(originalGraph.points.length);

      // 验证数据一致性
      for (let i = 0; i < originalGraph.points.length; i++) {
        expect(importedGraph.points[i].x).toBeCloseTo(originalGraph.points[i].x, 6);
        expect(importedGraph.points[i].y).toBeCloseTo(originalGraph.points[i].y, 6);
      }
    });
  });
});