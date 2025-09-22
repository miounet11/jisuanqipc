/**
 * Graph Type Definitions
 *
 * 图形计算器相关的类型定义，支持2D/3D图形渲染
 */

export enum FunctionType {
  FUNCTION_2D = '2d',            // y = f(x)
  FUNCTION_3D = '3d',            // z = f(x,y)
  PARAMETRIC_2D = 'parametric2d', // x=f(t), y=g(t)
  PARAMETRIC_3D = 'parametric3d', // x=f(t), y=g(t), z=h(t)
  POLAR = 'polar',               // r = f(θ)
  IMPLICIT = 'implicit',         // f(x,y) = 0
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Range {
  min: number;
  max: number;
}

export interface GraphStyle {
  color: string;
  lineWidth: number;
  lineType: 'solid' | 'dashed' | 'dotted';
  showPoints: boolean;
  pointSize: number;
}

export interface Graph3DStyle extends GraphStyle {
  material: 'solid' | 'wireframe' | 'points';
  opacity: number;
  doubleSided: boolean;
}

export interface Viewport {
  centerX: number;
  centerY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface CameraSettings {
  position: Point3D;
  target: Point3D;
  up: Point3D;
  fov: number;
}

export interface LightingSettings {
  ambient: number;
  directional: {
    direction: Point3D;
    intensity: number;
    color: string;
  };
}

export interface Annotation {
  type: 'point' | 'line' | 'text' | 'arrow';
  position: Point3D;
  content: string;
  style: AnnotationStyle;
  interactive?: boolean;
}

export interface AnnotationStyle {
  fontSize: number;
  fontColor: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

export interface Graph {
  id: string;
  expressionId: string;
  functionType: FunctionType;
  domain: Range;
  range: Range;
  resolution: number;
  points: Point3D[];
  style: GraphStyle | Graph3DStyle;
  viewport: Viewport;
  annotations: Annotation[];
  createdAt: Date;
}

export interface SpecialPoint {
  type: 'maximum' | 'minimum' | 'zero' | 'discontinuity' | 'inflection';
  position: Point3D;
  value: number;
  description: string;
}

export interface GraphExportOptions {
  format: 'png' | 'jpeg' | 'svg';
  width: number;
  height: number;
  quality?: number;
  backgroundColor?: string;
  dpi?: number;
}

export interface GraphValidation {
  maxResolution: number;
  maxPoints: number;
  maxAnnotations: number;
}