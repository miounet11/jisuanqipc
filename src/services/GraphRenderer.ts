/**
 * Graph Renderer Service
 *
 * 图形渲染服务的实现，负责2D/3D图形渲染和交互
 */

import {
  Expression,
  Graph,
  Point3D,
  Range,
  GraphStyle,
  Graph3DStyle,
  Viewport,
  CameraSettings,
  Annotation,
  SpecialPoint,
  GraphExportOptions,
  FunctionType,
} from '@/types';
import { GraphModel } from '@/models/Graph';
import { CalculatorService } from './CalculatorService';

// 自定义错误类
export class RenderError extends Error {
  constructor(message: string, public expression?: Expression) {
    super(message);
    this.name = 'RenderError';
  }
}

export class UnsupportedFunctionError extends Error {
  constructor(message: string, public functionName?: string) {
    super(message);
    this.name = 'UnsupportedFunctionError';
  }
}

// 渲染选项接口
export interface Render2DOptions {
  xRange: Range;
  yRange: Range;
  resolution: number;
  style: GraphStyle;
  showGrid?: boolean;
  showAxes?: boolean;
  samplingStrategy?: 'uniform' | 'adaptive';
}

export interface Render3DOptions {
  xRange: Range;
  yRange: Range;
  zRange: Range;
  xResolution: number;
  yResolution: number;
  style: Graph3DStyle;
  camera: CameraSettings;
  showWireframe?: boolean;
}

export interface ParametricOptions {
  parameterRange: Range;
  resolution: number;
  style: GraphStyle;
  closed?: boolean;
}

export interface PolarOptions {
  angleRange: Range;
  radiusRange: Range;
  resolution: number;
  style: GraphStyle;
  angleUnit: 'radian' | 'degree';
}

export interface ImplicitOptions {
  xRange: Range;
  yRange: Range;
  resolution: number;
  style: GraphStyle;
  contourValue: number;
  tolerance: number;
}

// 点值信息接口
export interface PointValue {
  mathCoordinate: Point3D;
  functionValue: number;
  onFunction: boolean;
  distance?: number;
}

// 图像导出数据接口
export interface ImageExportData {
  data: string; // Base64编码的图像数据
  mimeType: string;
  size: number;
  width: number;
  height: number;
}

export class GraphRenderer {
  private calculatorService: CalculatorService;

  constructor() {
    this.calculatorService = new CalculatorService();
  }

  /**
   * 渲染2D函数图形
   */
  public async render2D(
    expression: Expression,
    options: Render2DOptions
  ): Promise<Graph> {
    if (!expression.isValid) {
      throw new RenderError('无法渲染无效表达式', expression);
    }

    try {
      const points = await this.generate2DPoints(expression, options);

      const graph = new GraphModel(
        expression.id,
        FunctionType.FUNCTION_2D,
        options.xRange,
        options.yRange,
        points,
        {
          resolution: options.resolution,
          style: options.style,
        }
      );

      return graph.toJSON();
    } catch (error) {
      if (error instanceof RenderError || error instanceof UnsupportedFunctionError) {
        throw error;
      }
      throw new RenderError(
        `渲染2D图形失败: ${error instanceof Error ? error.message : '未知错误'}`,
        expression
      );
    }
  }

  /**
   * 生成2D函数点
   */
  private async generate2DPoints(
    expression: Expression,
    options: Render2DOptions
  ): Promise<Point3D[]> {
    const points: Point3D[] = [];
    const { xRange, resolution } = options;
    const step = (xRange.max - xRange.min) / resolution;

    for (let i = 0; i <= resolution; i++) {
      const x = xRange.min + i * step;

      try {
        // 设置变量值
        const variables = new Map(expression.variables);
        variables.set('x', x);

        // 创建临时表达式进行计算
        const tempExpression = { ...expression, variables };
        const result = await this.calculatorService.evaluate(tempExpression);

        if (result.value && typeof result.value === 'object' && 'toNumber' in result.value) {
          const y = (result.value as any).toNumber();

          if (isFinite(y)) {
            points.push({ x, y, z: 0 });
          }
        }
      } catch (error) {
        // 跳过计算错误的点（如除零、定义域外等）
        continue;
      }
    }

    if (points.length === 0) {
      throw new RenderError('无法生成有效的函数点', expression);
    }

    return points;
  }

  /**
   * 渲染3D函数图形
   */
  public async render3D(
    expression: Expression,
    options: Render3DOptions
  ): Promise<Graph> {
    if (!expression.isValid) {
      throw new RenderError('无法渲染无效表达式', expression);
    }

    try {
      const points = await this.generate3DPoints(expression, options);

      const graph = new GraphModel(
        expression.id,
        FunctionType.FUNCTION_3D,
        options.xRange,
        options.zRange, // 3D图形的range表示z范围
        points,
        {
          resolution: options.xResolution * options.yResolution,
          style: options.style,
        }
      );

      return graph.toJSON();
    } catch (error) {
      if (error instanceof RenderError || error instanceof UnsupportedFunctionError) {
        throw error;
      }
      throw new RenderError(
        `渲染3D图形失败: ${error instanceof Error ? error.message : '未知错误'}`,
        expression
      );
    }
  }

  /**
   * 生成3D函数点
   */
  private async generate3DPoints(
    expression: Expression,
    options: Render3DOptions
  ): Promise<Point3D[]> {
    const points: Point3D[] = [];
    const { xRange, yRange, xResolution, yResolution } = options;
    const xStep = (xRange.max - xRange.min) / xResolution;
    const yStep = (yRange.max - yRange.min) / yResolution;

    for (let i = 0; i <= xResolution; i++) {
      for (let j = 0; j <= yResolution; j++) {
        const x = xRange.min + i * xStep;
        const y = yRange.min + j * yStep;

        try {
          // 设置变量值
          const variables = new Map(expression.variables);
          variables.set('x', x);
          variables.set('y', y);

          // 创建临时表达式进行计算
          const tempExpression = { ...expression, variables };
          const result = await this.calculatorService.evaluate(tempExpression);

          if (result.value && typeof result.value === 'object' && 'toNumber' in result.value) {
            const z = (result.value as any).toNumber();

            if (isFinite(z)) {
              points.push({ x, y, z });
            }
          }
        } catch (error) {
          // 跳过计算错误的点
          continue;
        }
      }
    }

    if (points.length === 0) {
      throw new RenderError('无法生成有效的3D函数点', expression);
    }

    return points;
  }

  /**
   * 渲染参数方程
   */
  public async renderParametric(
    expressions: Expression[],
    options: ParametricOptions
  ): Promise<Graph> {
    if (expressions.length < 2) {
      throw new RenderError('参数方程至少需要两个表达式（x和y）');
    }

    const xExpression = expressions[0];
    const yExpression = expressions[1];
    const zExpression = expressions.length > 2 ? expressions[2] : null;

    try {
      const points = await this.generateParametricPoints(
        xExpression,
        yExpression,
        zExpression,
        options
      );

      const functionType = zExpression
        ? FunctionType.PARAMETRIC_3D
        : FunctionType.PARAMETRIC_2D;

      const graph = new GraphModel(
        xExpression.id,
        functionType,
        options.parameterRange,
        { min: 0, max: 1 }, // 参数方程的范围由参数决定
        points,
        {
          resolution: options.resolution,
          style: options.style,
        }
      );

      return graph.toJSON();
    } catch (error) {
      throw new RenderError(
        `渲染参数方程失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 生成参数方程点
   */
  private async generateParametricPoints(
    xExpression: Expression,
    yExpression: Expression,
    zExpression: Expression | null,
    options: ParametricOptions
  ): Promise<Point3D[]> {
    const points: Point3D[] = [];
    const { parameterRange, resolution } = options;
    const step = (parameterRange.max - parameterRange.min) / resolution;

    for (let i = 0; i <= resolution; i++) {
      const t = parameterRange.min + i * step;

      try {
        // 计算x坐标
        const xVariables = new Map(xExpression.variables);
        xVariables.set('t', t);
        const xTempExpression = { ...xExpression, variables: xVariables };
        const xResult = await this.calculatorService.evaluate(xTempExpression);
        const x = (xResult.value as any).toNumber();

        // 计算y坐标
        const yVariables = new Map(yExpression.variables);
        yVariables.set('t', t);
        const yTempExpression = { ...yExpression, variables: yVariables };
        const yResult = await this.calculatorService.evaluate(yTempExpression);
        const y = (yResult.value as any).toNumber();

        // 计算z坐标（如果有）
        let z = 0;
        if (zExpression) {
          const zVariables = new Map(zExpression.variables);
          zVariables.set('t', t);
          const zTempExpression = { ...zExpression, variables: zVariables };
          const zResult = await this.calculatorService.evaluate(zTempExpression);
          z = (zResult.value as any).toNumber();
        }

        if (isFinite(x) && isFinite(y) && isFinite(z)) {
          points.push({ x, y, z });
        }
      } catch (error) {
        // 跳过计算错误的点
        continue;
      }
    }

    return points;
  }

  /**
   * 渲染极坐标函数
   */
  public async renderPolar(
    expression: Expression,
    options: PolarOptions
  ): Promise<Graph> {
    if (!expression.isValid) {
      throw new RenderError('无法渲染无效表达式', expression);
    }

    try {
      const points = await this.generatePolarPoints(expression, options);

      const graph = new GraphModel(
        expression.id,
        FunctionType.POLAR,
        options.angleRange,
        options.radiusRange,
        points,
        {
          resolution: options.resolution,
          style: options.style,
        }
      );

      return graph.toJSON();
    } catch (error) {
      throw new RenderError(
        `渲染极坐标函数失败: ${error instanceof Error ? error.message : '未知错误'}`,
        expression
      );
    }
  }

  /**
   * 生成极坐标点
   */
  private async generatePolarPoints(
    expression: Expression,
    options: PolarOptions
  ): Promise<Point3D[]> {
    const points: Point3D[] = [];
    const { angleRange, resolution, angleUnit } = options;
    const step = (angleRange.max - angleRange.min) / resolution;

    for (let i = 0; i <= resolution; i++) {
      const theta = angleRange.min + i * step;
      const thetaInRadians = angleUnit === 'degree' ? (theta * Math.PI) / 180 : theta;

      try {
        // 设置角度变量
        const variables = new Map(expression.variables);
        variables.set('theta', theta);

        // 创建临时表达式进行计算
        const tempExpression = { ...expression, variables };
        const result = await this.calculatorService.evaluate(tempExpression);
        const r = (result.value as any).toNumber();

        if (isFinite(r) && r >= 0) {
          // 转换为直角坐标
          const x = r * Math.cos(thetaInRadians);
          const y = r * Math.sin(thetaInRadians);
          points.push({ x, y, z: 0 });
        }
      } catch (error) {
        // 跳过计算错误的点
        continue;
      }
    }

    return points;
  }

  /**
   * 渲染隐函数
   */
  public async renderImplicit(
    expression: Expression,
    options: ImplicitOptions
  ): Promise<Graph> {
    if (!expression.isValid) {
      throw new RenderError('无法渲染无效表达式', expression);
    }

    try {
      const points = await this.generateImplicitPoints(expression, options);

      const graph = new GraphModel(
        expression.id,
        FunctionType.IMPLICIT,
        options.xRange,
        options.yRange,
        points,
        {
          resolution: options.resolution,
          style: options.style,
        }
      );

      return graph.toJSON();
    } catch (error) {
      throw new RenderError(
        `渲染隐函数失败: ${error instanceof Error ? error.message : '未知错误'}`,
        expression
      );
    }
  }

  /**
   * 生成隐函数点（使用等值线方法）
   */
  private async generateImplicitPoints(
    expression: Expression,
    options: ImplicitOptions
  ): Promise<Point3D[]> {
    const points: Point3D[] = [];
    const { xRange, yRange, resolution, contourValue, tolerance } = options;
    const xStep = (xRange.max - xRange.min) / resolution;
    const yStep = (yRange.max - yRange.min) / resolution;

    // 简化的等值线算法
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const x = xRange.min + i * xStep;
        const y = yRange.min + j * yStep;

        try {
          // 计算四个角点的函数值
          const corners = [
            { x, y },
            { x: x + xStep, y },
            { x: x + xStep, y: y + yStep },
            { x, y: y + yStep },
          ];

          const values = await Promise.all(
            corners.map(async corner => {
              const variables = new Map(expression.variables);
              variables.set('x', corner.x);
              variables.set('y', corner.y);
              const tempExpression = { ...expression, variables };
              const result = await this.calculatorService.evaluate(tempExpression);
              return (result.value as any).toNumber();
            })
          );

          // 检查是否有等值线穿过此网格
          const hasContour = this.checkContourCrossing(values, contourValue);

          if (hasContour) {
            // 在网格内查找更精确的等值线点
            const contourPoints = await this.findContourPoints(
              expression,
              corners,
              contourValue,
              tolerance
            );
            points.push(...contourPoints);
          }
        } catch (error) {
          // 跳过计算错误的网格
          continue;
        }
      }
    }

    return points;
  }

  /**
   * 检查等值线是否穿过网格
   */
  private checkContourCrossing(values: number[], contourValue: number): boolean {
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        if (
          (values[i] <= contourValue && values[j] >= contourValue) ||
          (values[i] >= contourValue && values[j] <= contourValue)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 在网格内查找等值线点
   */
  private async findContourPoints(
    expression: Expression,
    corners: Array<{ x: number; y: number }>,
    contourValue: number,
    tolerance: number
  ): Promise<Point3D[]> {
    const points: Point3D[] = [];

    // 简化实现：返回网格中心点
    const centerX = (corners[0].x + corners[2].x) / 2;
    const centerY = (corners[0].y + corners[2].y) / 2;

    try {
      const variables = new Map(expression.variables);
      variables.set('x', centerX);
      variables.set('y', centerY);
      const tempExpression = { ...expression, variables };
      const result = await this.calculatorService.evaluate(tempExpression);
      const value = (result.value as any).toNumber();

      if (Math.abs(value - contourValue) <= tolerance) {
        points.push({ x: centerX, y: centerY, z: 0 });
      }
    } catch (error) {
      // 忽略计算错误
    }

    return points;
  }

  /**
   * 更新图形视口
   */
  public async updateViewport(graph: Graph, viewport: Viewport): Promise<Graph> {
    const graphModel = GraphModel.fromJSON(graph);
    graphModel.updateViewport(viewport);
    return graphModel.toJSON();
  }

  /**
   * 添加注释
   */
  public async addAnnotations(graph: Graph, annotations: Annotation[]): Promise<Graph> {
    const graphModel = GraphModel.fromJSON(graph);

    for (const annotation of annotations) {
      graphModel.addAnnotation(annotation);
    }

    return graphModel.toJSON();
  }

  /**
   * 查找特殊点
   */
  public async findSpecialPoints(
    expression: Expression,
    domain: Range
  ): Promise<SpecialPoint[]> {
    if (!expression.isValid) {
      throw new RenderError('无法分析无效表达式', expression);
    }

    try {
      // 生成高密度点用于分析
      const options: Render2DOptions = {
        xRange: domain,
        yRange: { min: -100, max: 100 }, // 临时范围
        resolution: 1000,
        style: {
          color: '#000000',
          lineWidth: 1,
          lineType: 'solid',
          showPoints: false,
          pointSize: 1,
        },
      };

      const points = await this.generate2DPoints(expression, options);

      // 使用GraphModel的特殊点查找功能
      const graph = new GraphModel(
        expression.id,
        FunctionType.FUNCTION_2D,
        domain,
        { min: 0, max: 1 },
        points
      );

      return graph.findSpecialPoints();
    } catch (error) {
      throw new RenderError(
        `查找特殊点失败: ${error instanceof Error ? error.message : '未知错误'}`,
        expression
      );
    }
  }

  /**
   * 导出图形为图像
   */
  public async exportImage(
    graph: Graph,
    options: GraphExportOptions
  ): Promise<ImageExportData> {
    try {
      // 这里应该实现实际的图像渲染和导出
      // 由于这是契约实现，返回模拟数据
      const mockImageData = this.generateMockImageData(options);

      return {
        data: mockImageData,
        mimeType: `image/${options.format}`,
        size: mockImageData.length,
        width: options.width,
        height: options.height,
      };
    } catch (error) {
      throw new RenderError(
        `导出图像失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 生成模拟图像数据
   */
  private generateMockImageData(options: GraphExportOptions): string {
    // 生成一个简单的Base64编码的1x1像素图像
    const canvas = `data:image/${options.format};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
    return canvas.split(',')[1]; // 返回Base64部分
  }

  /**
   * 获取屏幕坐标处的点值
   */
  public async getPointValue(
    graph: Graph,
    screenX: number,
    screenY: number
  ): Promise<PointValue | null> {
    try {
      // 将屏幕坐标转换为数学坐标
      const mathCoordinate = this.screenToMathCoordinates(graph, screenX, screenY);

      // 查找最近的函数点
      const nearestPoint = this.findNearestPoint(graph.points, mathCoordinate);

      if (!nearestPoint) {
        return null;
      }

      const distance = this.calculateDistance(mathCoordinate, nearestPoint);

      return {
        mathCoordinate,
        functionValue: nearestPoint.y,
        onFunction: distance < 0.1, // 阈值可以调整
        distance,
      };
    } catch (error) {
      console.warn('Failed to get point value:', error);
      return null;
    }
  }

  /**
   * 屏幕坐标转数学坐标
   */
  private screenToMathCoordinates(graph: Graph, screenX: number, screenY: number): Point3D {
    const { viewport } = graph;

    // 简化的坐标转换（实际实现需要考虑更多因素）
    const mathX = (screenX - 400) / viewport.scaleX + viewport.centerX; // 假设屏幕宽度800
    const mathY = (300 - screenY) / viewport.scaleY + viewport.centerY; // 假设屏幕高度600

    return { x: mathX, y: mathY, z: 0 };
  }

  /**
   * 查找最近的点
   */
  private findNearestPoint(points: Point3D[], target: Point3D): Point3D | null {
    if (points.length === 0) {
      return null;
    }

    let nearest = points[0];
    let minDistance = this.calculateDistance(target, nearest);

    for (const point of points) {
      const distance = this.calculateDistance(target, point);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    }

    return nearest;
  }

  /**
   * 计算两点间距离
   */
  private calculateDistance(p1: Point3D, p2: Point3D): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * 获取渲染器信息
   */
  public getRendererInfo(): {
    supportedFunctionTypes: FunctionType[];
    maxResolution: number;
    version: string;
  } {
    return {
      supportedFunctionTypes: [
        FunctionType.FUNCTION_2D,
        FunctionType.FUNCTION_3D,
        FunctionType.PARAMETRIC_2D,
        FunctionType.PARAMETRIC_3D,
        FunctionType.POLAR,
        FunctionType.IMPLICIT,
      ],
      maxResolution: 10000,
      version: '1.0.0',
    };
  }

  /**
   * 检查函数类型支持
   */
  public isFunctionTypeSupported(functionType: FunctionType): boolean {
    return this.getRendererInfo().supportedFunctionTypes.includes(functionType);
  }
}