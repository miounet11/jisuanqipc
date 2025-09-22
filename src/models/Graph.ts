/**
 * Graph Model
 *
 * 图形计算器的模型实现，包含点管理、视口控制和注释功能
 */

import {
  Graph,
  Point3D,
  Range,
  GraphStyle,
  Graph3DStyle,
  Viewport,
  CameraSettings,
  LightingSettings,
  Annotation,
  AnnotationStyle,
  SpecialPoint,
  GraphExportOptions,
  GraphValidation,
  FunctionType,
} from '@/types';

// 简化的UUID生成器
const generateUUID = (): string => {
  return 'graph-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
};

export class GraphModel implements Graph {
  public readonly id: string;
  public readonly expressionId: string;
  public functionType: FunctionType;
  public domain: Range;
  public range: Range;
  public resolution: number;
  public points: Point3D[];
  public style: GraphStyle | Graph3DStyle;
  public viewport: Viewport;
  public annotations: Annotation[];
  public readonly createdAt: Date;

  private static readonly DEFAULT_VALIDATION: GraphValidation = {
    maxResolution: 10000,
    maxPoints: 50000,
    maxAnnotations: 100,
  };

  private static readonly DEFAULT_VIEWPORT: Viewport = {
    centerX: 0,
    centerY: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  };

  private static readonly DEFAULT_2D_STYLE: GraphStyle = {
    color: '#007AFF',
    lineWidth: 2,
    lineType: 'solid',
    showPoints: false,
    pointSize: 3,
  };

  private static readonly DEFAULT_3D_STYLE: Graph3DStyle = {
    color: '#007AFF',
    lineWidth: 1,
    lineType: 'solid',
    showPoints: false,
    pointSize: 2,
    material: 'solid',
    opacity: 0.8,
    doubleSided: true,
  };

  constructor(
    expressionId: string,
    functionType: FunctionType,
    domain: Range,
    range: Range,
    points: Point3D[] = [],
    options: {
      resolution?: number;
      style?: GraphStyle | Graph3DStyle;
      viewport?: Partial<Viewport>;
      annotations?: Annotation[];
      id?: string;
    } = {}
  ) {
    this.id = options.id || generateUUID();
    this.expressionId = expressionId;
    this.functionType = functionType;
    this.domain = { ...domain };
    this.range = { ...range };
    this.resolution = options.resolution || 100;
    this.points = [...points];
    this.style = options.style || this.getDefaultStyle();
    this.viewport = { ...GraphModel.DEFAULT_VIEWPORT, ...options.viewport };
    this.annotations = options.annotations ? [...options.annotations] : [];
    this.createdAt = new Date();

    this.validate();
  }

  /**
   * 获取默认样式
   */
  private getDefaultStyle(): GraphStyle | Graph3DStyle {
    if (this.functionType === FunctionType.FUNCTION_3D ||
        this.functionType === FunctionType.PARAMETRIC_3D) {
      return { ...GraphModel.DEFAULT_3D_STYLE };
    }
    return { ...GraphModel.DEFAULT_2D_STYLE };
  }

  /**
   * 验证图形数据
   */
  private validate(): void {
    const validation = GraphModel.DEFAULT_VALIDATION;

    if (!this.expressionId || this.expressionId.trim().length === 0) {
      throw new Error('图形必须关联有效的表达式ID');
    }

    if (!Object.values(FunctionType).includes(this.functionType)) {
      throw new Error(`无效的函数类型: ${this.functionType}`);
    }

    if (this.resolution > validation.maxResolution) {
      throw new Error(`分辨率不能超过 ${validation.maxResolution}`);
    }

    if (this.points.length > validation.maxPoints) {
      throw new Error(`点数量不能超过 ${validation.maxPoints}`);
    }

    if (this.annotations.length > validation.maxAnnotations) {
      throw new Error(`注释数量不能超过 ${validation.maxAnnotations}`);
    }

    if (this.domain.min >= this.domain.max) {
      throw new Error('定义域的最小值必须小于最大值');
    }

    if (this.range.min >= this.range.max) {
      throw new Error('值域的最小值必须小于最大值');
    }
  }

  /**
   * 添加点到图形
   */
  public addPoint(point: Point3D): void {
    if (this.points.length >= GraphModel.DEFAULT_VALIDATION.maxPoints) {
      throw new Error('已达到最大点数限制');
    }

    this.points.push({ ...point });
  }

  /**
   * 批量添加点
   */
  public addPoints(points: Point3D[]): void {
    if (this.points.length + points.length > GraphModel.DEFAULT_VALIDATION.maxPoints) {
      throw new Error('添加点后将超过最大点数限制');
    }

    this.points.push(...points.map(p => ({ ...p })));
  }

  /**
   * 清空所有点
   */
  public clearPoints(): void {
    this.points = [];
  }

  /**
   * 更新点数据
   */
  public updatePoints(points: Point3D[]): void {
    this.clearPoints();
    this.addPoints(points);
  }

  /**
   * 获取点的边界框
   */
  public getBoundingBox(): {
    x: Range;
    y: Range;
    z: Range;
  } {
    if (this.points.length === 0) {
      return {
        x: this.domain,
        y: this.range,
        z: { min: 0, max: 0 },
      };
    }

    const xs = this.points.map(p => p.x);
    const ys = this.points.map(p => p.y);
    const zs = this.points.map(p => p.z);

    return {
      x: { min: Math.min(...xs), max: Math.max(...xs) },
      y: { min: Math.min(...ys), max: Math.max(...ys) },
      z: { min: Math.min(...zs), max: Math.max(...zs) },
    };
  }

  /**
   * 更新视口
   */
  public updateViewport(viewport: Partial<Viewport>): void {
    this.viewport = { ...this.viewport, ...viewport };
  }

  /**
   * 缩放视口
   */
  public zoom(factor: number, centerX?: number, centerY?: number): void {
    if (factor <= 0) {
      throw new Error('缩放因子必须为正数');
    }

    this.viewport.scaleX *= factor;
    this.viewport.scaleY *= factor;

    // 如果提供了中心点，调整视口中心以实现围绕该点缩放
    if (centerX !== undefined && centerY !== undefined) {
      const deltaX = (centerX - this.viewport.centerX) * (1 - factor);
      const deltaY = (centerY - this.viewport.centerY) * (1 - factor);
      this.viewport.centerX += deltaX;
      this.viewport.centerY += deltaY;
    }
  }

  /**
   * 平移视口
   */
  public pan(deltaX: number, deltaY: number): void {
    this.viewport.centerX += deltaX / this.viewport.scaleX;
    this.viewport.centerY += deltaY / this.viewport.scaleY;
  }

  /**
   * 旋转视口
   */
  public rotate(angle: number): void {
    this.viewport.rotation = (this.viewport.rotation + angle) % (2 * Math.PI);
  }

  /**
   * 重置视口
   */
  public resetViewport(): void {
    this.viewport = { ...GraphModel.DEFAULT_VIEWPORT };
  }

  /**
   * 自动调整视口以适应所有点
   */
  public fitToView(padding: number = 0.1): void {
    const bbox = this.getBoundingBox();

    const xRange = bbox.x.max - bbox.x.min;
    const yRange = bbox.y.max - bbox.y.min;

    if (xRange === 0 || yRange === 0) {
      return;
    }

    const paddingX = xRange * padding;
    const paddingY = yRange * padding;

    this.viewport.centerX = (bbox.x.min + bbox.x.max) / 2;
    this.viewport.centerY = (bbox.y.min + bbox.y.max) / 2;
    this.viewport.scaleX = 1 / (xRange + 2 * paddingX);
    this.viewport.scaleY = 1 / (yRange + 2 * paddingY);
  }

  /**
   * 添加注释
   */
  public addAnnotation(annotation: Annotation): void {
    if (this.annotations.length >= GraphModel.DEFAULT_VALIDATION.maxAnnotations) {
      throw new Error('已达到最大注释数量限制');
    }

    this.annotations.push({ ...annotation });
  }

  /**
   * 移除注释
   */
  public removeAnnotation(index: number): boolean {
    if (index < 0 || index >= this.annotations.length) {
      return false;
    }

    this.annotations.splice(index, 1);
    return true;
  }

  /**
   * 清空所有注释
   */
  public clearAnnotations(): void {
    this.annotations = [];
  }

  /**
   * 更新注释
   */
  public updateAnnotation(index: number, annotation: Partial<Annotation>): boolean {
    if (index < 0 || index >= this.annotations.length) {
      return false;
    }

    this.annotations[index] = { ...this.annotations[index], ...annotation };
    return true;
  }

  /**
   * 查找特殊点
   */
  public findSpecialPoints(tolerance: number = 0.001): SpecialPoint[] {
    const specialPoints: SpecialPoint[] = [];

    if (this.points.length < 3) {
      return specialPoints;
    }

    // 查找零点
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];

      if (Math.abs(p1.y) < tolerance) {
        specialPoints.push({
          type: 'zero',
          position: p1,
          value: p1.y,
          description: `零点: (${p1.x.toFixed(3)}, ${p1.y.toFixed(3)})`,
        });
      }

      // 检查符号变化（可能的零点）
      if (p1.y * p2.y < 0) {
        const x = p1.x + (p2.x - p1.x) * (-p1.y / (p2.y - p1.y));
        specialPoints.push({
          type: 'zero',
          position: { x, y: 0, z: 0 },
          value: 0,
          description: `零点: (${x.toFixed(3)}, 0)`,
        });
      }
    }

    // 查找极值点
    for (let i = 1; i < this.points.length - 1; i++) {
      const prev = this.points[i - 1];
      const curr = this.points[i];
      const next = this.points[i + 1];

      const leftSlope = (curr.y - prev.y) / (curr.x - prev.x);
      const rightSlope = (next.y - curr.y) / (next.x - curr.x);

      // 检查是否为极大值或极小值
      if (leftSlope > 0 && rightSlope < 0) {
        specialPoints.push({
          type: 'maximum',
          position: curr,
          value: curr.y,
          description: `极大值: (${curr.x.toFixed(3)}, ${curr.y.toFixed(3)})`,
        });
      } else if (leftSlope < 0 && rightSlope > 0) {
        specialPoints.push({
          type: 'minimum',
          position: curr,
          value: curr.y,
          description: `极小值: (${curr.x.toFixed(3)}, ${curr.y.toFixed(3)})`,
        });
      }
    }

    return specialPoints;
  }

  /**
   * 更新样式
   */
  public updateStyle(style: Partial<GraphStyle | Graph3DStyle>): void {
    this.style = { ...this.style, ...style };
  }

  /**
   * 获取渲染统计信息
   */
  public getRenderStats(): {
    pointCount: number;
    annotationCount: number;
    resolution: number;
    functionType: string;
    memoryEstimate: number;
  } {
    // 估算内存使用量（字节）
    const pointMemory = this.points.length * 24; // 每个Point3D约24字节
    const annotationMemory = this.annotations.length * 200; // 每个注释约200字节
    const memoryEstimate = pointMemory + annotationMemory;

    return {
      pointCount: this.points.length,
      annotationCount: this.annotations.length,
      resolution: this.resolution,
      functionType: this.functionType,
      memoryEstimate,
    };
  }

  /**
   * 优化图形数据
   */
  public optimize(options: {
    simplifyTolerance?: number;
    maxPoints?: number;
    removeOutliers?: boolean;
  } = {}): void {
    const { simplifyTolerance = 0.001, maxPoints = 1000, removeOutliers = false } = options;

    if (this.points.length <= maxPoints) {
      return;
    }

    // 简化点数据
    const simplified = this.simplifyPoints(simplifyTolerance);

    // 如果简化后仍然太多点，则进行采样
    if (simplified.length > maxPoints) {
      const step = Math.ceil(simplified.length / maxPoints);
      this.points = simplified.filter((_, index) => index % step === 0);
    } else {
      this.points = simplified;
    }

    // 移除异常值
    if (removeOutliers) {
      this.removeOutliers();
    }
  }

  /**
   * 简化点数据（Douglas-Peucker算法的简化版）
   */
  private simplifyPoints(tolerance: number): Point3D[] {
    if (this.points.length <= 2) {
      return [...this.points];
    }

    const simplified: Point3D[] = [this.points[0]];

    for (let i = 1; i < this.points.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const curr = this.points[i];
      const next = this.points[i + 1];

      // 计算点到直线的距离
      const distance = this.pointToLineDistance(curr, prev, next);

      if (distance > tolerance) {
        simplified.push(curr);
      }
    }

    simplified.push(this.points[this.points.length - 1]);
    return simplified;
  }

  /**
   * 计算点到直线的距离
   */
  private pointToLineDistance(point: Point3D, lineStart: Point3D, lineEnd: Point3D): number {
    const A = lineEnd.y - lineStart.y;
    const B = lineStart.x - lineEnd.x;
    const C = lineEnd.x * lineStart.y - lineStart.x * lineEnd.y;

    return Math.abs(A * point.x + B * point.y + C) / Math.sqrt(A * A + B * B);
  }

  /**
   * 移除异常值
   */
  private removeOutliers(): void {
    if (this.points.length < 3) {
      return;
    }

    const yValues = this.points.map(p => p.y);
    const q1 = this.quantile(yValues, 0.25);
    const q3 = this.quantile(yValues, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    this.points = this.points.filter(p => p.y >= lowerBound && p.y <= upperBound);
  }

  /**
   * 计算分位数
   */
  private quantile(values: number[], q: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = q * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
  }

  /**
   * 克隆图形对象
   */
  public clone(): GraphModel {
    return new GraphModel(
      this.expressionId,
      this.functionType,
      this.domain,
      this.range,
      this.points,
      {
        resolution: this.resolution,
        style: this.style,
        viewport: this.viewport,
        annotations: this.annotations,
        id: this.id,
      }
    );
  }

  /**
   * 序列化为JSON
   */
  public toJSON(): Graph {
    return {
      id: this.id,
      expressionId: this.expressionId,
      functionType: this.functionType,
      domain: this.domain,
      range: this.range,
      resolution: this.resolution,
      points: this.points,
      style: this.style,
      viewport: this.viewport,
      annotations: this.annotations,
      createdAt: this.createdAt,
    };
  }

  /**
   * 从JSON反序列化
   */
  public static fromJSON(data: Graph): GraphModel {
    return new GraphModel(
      data.expressionId,
      data.functionType,
      data.domain,
      data.range,
      data.points,
      {
        resolution: data.resolution,
        style: data.style,
        viewport: data.viewport,
        annotations: data.annotations,
        id: data.id,
      }
    );
  }

  /**
   * 获取验证规则
   */
  public static getValidationRules(): GraphValidation {
    return { ...GraphModel.DEFAULT_VALIDATION };
  }
}