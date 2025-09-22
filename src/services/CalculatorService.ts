/**
 * Calculator Service
 *
 * 计算服务的核心实现，负责表达式解析、计算和简化
 */

import { Decimal } from 'decimal.js';
import { ExpressionModel } from '@/models/Expression';
import { ResultModel } from '@/models/Result';
import {
  Expression,
  Result,
  CalculatorType,
  ExpressionType,
  FormatOptions,
  TokenType,
  ASTNode,
} from '@/types';

// 自定义错误类
export class ExpressionParseError extends Error {
  constructor(message: string, public position?: number) {
    super(message);
    this.name = 'ExpressionParseError';
  }
}

export class CalculationError extends Error {
  constructor(message: string, public expression?: Expression) {
    super(message);
    this.name = 'CalculationError';
  }
}

export class UnsupportedOperationError extends Error {
  constructor(message: string, public operation?: string) {
    super(message);
    this.name = 'UnsupportedOperationError';
  }
}

export class CalculatorService {
  private precision: number = 10;

  constructor(precision: number = 10) {
    this.precision = precision;
    this.configureDecimal();
  }

  /**
   * 配置Decimal.js
   */
  private configureDecimal(): void {
    Decimal.config({
      precision: this.precision + 5, // 增加一些缓冲精度
      rounding: Decimal.ROUND_HALF_UP,
      toExpNeg: -15,
      toExpPos: 20,
      maxE: 9e15,
      minE: -9e15,
      modulo: Decimal.ROUND_DOWN,
      crypto: false,
    });
  }

  /**
   * 解析表达式
   */
  public async parseExpression(
    input: string,
    calculatorType: CalculatorType
  ): Promise<Expression> {
    if (!input || input.trim().length === 0) {
      throw new ExpressionParseError('表达式不能为空');
    }

    const expressionType = this.determineExpressionType(input, calculatorType);

    try {
      const expression = new ExpressionModel(input, expressionType);

      // 执行词法分析
      expression.tokenize();

      // 执行语法分析
      expression.parse();

      if (!expression.isValid) {
        throw new ExpressionParseError(
          expression.errorMessage || '表达式解析失败'
        );
      }

      return expression.toJSON();
    } catch (error) {
      if (error instanceof ExpressionParseError) {
        throw error;
      }
      throw new ExpressionParseError(
        error instanceof Error ? error.message : '未知解析错误'
      );
    }
  }

  /**
   * 确定表达式类型
   */
  private determineExpressionType(
    input: string,
    calculatorType: CalculatorType
  ): ExpressionType {
    const trimmedInput = input.trim();

    // 检查是否包含等号（方程）
    if (trimmedInput.includes('=')) {
      return ExpressionType.EQUATION;
    }

    // 检查是否包含科学函数
    const scientificFunctions = ['sin', 'cos', 'tan', 'ln', 'log', 'sqrt', 'abs'];
    const hasScientificFunction = scientificFunctions.some(func =>
      trimmedInput.includes(func)
    );

    if (hasScientificFunction || calculatorType === CalculatorType.SCIENTIFIC) {
      return ExpressionType.SCIENTIFIC;
    }

    // 检查是否包含函数形式（参数化函数）
    if (trimmedInput.includes('(') && trimmedInput.match(/[a-zA-Z]\(/)) {
      return ExpressionType.FUNCTION;
    }

    // 检查是否包含矩阵表示
    if (trimmedInput.includes('[') && trimmedInput.includes(']')) {
      return ExpressionType.MATRIX;
    }

    // 默认为算术表达式
    return ExpressionType.ARITHMETIC;
  }

  /**
   * 计算表达式
   */
  public async evaluate(
    expression: Expression,
    options: FormatOptions = {}
  ): Promise<Result> {
    if (!expression.isValid) {
      throw new CalculationError(
        expression.errorMessage || '无法计算无效表达式',
        expression
      );
    }

    const startTime = Date.now();

    try {
      let result: Decimal;

      if (expression.ast) {
        result = this.evaluateAST(expression.ast, expression.variables);
      } else {
        // 如果没有AST，尝试重新解析
        const expressionModel = ExpressionModel.fromJSON(expression);
        expressionModel.parse();

        if (!expressionModel.ast) {
          throw new CalculationError('无法生成抽象语法树', expression);
        }

        result = this.evaluateAST(expressionModel.ast, expression.variables);
      }

      const computationTime = Date.now() - startTime;

      const resultModel = new ResultModel(
        expression.id,
        result,
        {
          precision: options.precision || this.precision,
          notation: options.notation,
          unit: options.unit,
          locale: options.locale,
        }
      );

      resultModel.setComputationTime(computationTime);
      return resultModel.toJSON();

    } catch (error) {
      if (error instanceof CalculationError) {
        throw error;
      }
      throw new CalculationError(
        error instanceof Error ? error.message : '计算错误',
        expression
      );
    }
  }

  /**
   * 计算AST节点
   */
  private evaluateAST(node: ASTNode, variables: Map<string, number>): Decimal {
    switch (node.type) {
      case 'number':
        return new Decimal(node.value as number);

      case 'variable':
        const varName = node.value as string;
        const varValue = variables.get(varName);
        if (varValue === undefined) {
          throw new CalculationError(`未定义的变量: ${varName}`);
        }
        return new Decimal(varValue);

      case 'binary':
        return this.evaluateBinaryOperation(node, variables);

      case 'unary':
        return this.evaluateUnaryOperation(node, variables);

      case 'function':
        return this.evaluateFunction(node, variables);

      default:
        throw new CalculationError(`不支持的节点类型: ${node.type}`);
    }
  }

  /**
   * 计算二元运算
   */
  private evaluateBinaryOperation(
    node: ASTNode,
    variables: Map<string, number>
  ): Decimal {
    if (!node.children || node.children.length !== 2) {
      throw new CalculationError('二元运算需要两个操作数');
    }

    const left = this.evaluateAST(node.children[0], variables);
    const right = this.evaluateAST(node.children[1], variables);
    const operator = node.value as string;

    switch (operator) {
      case '+':
        return left.plus(right);
      case '-':
        return left.minus(right);
      case '*':
        return left.times(right);
      case '/':
        if (right.isZero()) {
          throw new CalculationError('除零错误');
        }
        return left.dividedBy(right);
      case '^':
      case '**':
        return left.pow(right);
      case '%':
        return left.modulo(right);
      default:
        throw new CalculationError(`不支持的运算符: ${operator}`);
    }
  }

  /**
   * 计算一元运算
   */
  private evaluateUnaryOperation(
    node: ASTNode,
    variables: Map<string, number>
  ): Decimal {
    if (!node.children || node.children.length !== 1) {
      throw new CalculationError('一元运算需要一个操作数');
    }

    const operand = this.evaluateAST(node.children[0], variables);
    const operator = node.value as string;

    switch (operator) {
      case '+':
        return operand;
      case '-':
        return operand.negated();
      default:
        throw new CalculationError(`不支持的一元运算符: ${operator}`);
    }
  }

  /**
   * 计算函数
   */
  private evaluateFunction(
    node: ASTNode,
    variables: Map<string, number>
  ): Decimal {
    if (!node.children || node.children.length === 0) {
      throw new CalculationError('函数调用需要参数');
    }

    const functionName = (node.value as string).toLowerCase();
    const args = node.children.map(child => this.evaluateAST(child, variables));

    switch (functionName) {
      case 'sin':
        this.validateArgumentCount('sin', args, 1);
        return new Decimal(Math.sin(args[0].toNumber()));

      case 'cos':
        this.validateArgumentCount('cos', args, 1);
        return new Decimal(Math.cos(args[0].toNumber()));

      case 'tan':
        this.validateArgumentCount('tan', args, 1);
        return new Decimal(Math.tan(args[0].toNumber()));

      case 'asin':
        this.validateArgumentCount('asin', args, 1);
        const asinValue = args[0].toNumber();
        if (asinValue < -1 || asinValue > 1) {
          throw new CalculationError('asin参数必须在-1到1之间');
        }
        return new Decimal(Math.asin(asinValue));

      case 'acos':
        this.validateArgumentCount('acos', args, 1);
        const acosValue = args[0].toNumber();
        if (acosValue < -1 || acosValue > 1) {
          throw new CalculationError('acos参数必须在-1到1之间');
        }
        return new Decimal(Math.acos(acosValue));

      case 'atan':
        this.validateArgumentCount('atan', args, 1);
        return new Decimal(Math.atan(args[0].toNumber()));

      case 'ln':
        this.validateArgumentCount('ln', args, 1);
        if (args[0].lte(0)) {
          throw new CalculationError('ln参数必须大于0');
        }
        return new Decimal(Math.log(args[0].toNumber()));

      case 'log':
        this.validateArgumentCount('log', args, 1);
        if (args[0].lte(0)) {
          throw new CalculationError('log参数必须大于0');
        }
        return new Decimal(Math.log10(args[0].toNumber()));

      case 'sqrt':
        this.validateArgumentCount('sqrt', args, 1);
        if (args[0].lt(0)) {
          throw new CalculationError('sqrt参数不能为负数');
        }
        return args[0].sqrt();

      case 'abs':
        this.validateArgumentCount('abs', args, 1);
        return args[0].abs();

      case 'ceil':
        this.validateArgumentCount('ceil', args, 1);
        return args[0].ceil();

      case 'floor':
        this.validateArgumentCount('floor', args, 1);
        return args[0].floor();

      case 'round':
        this.validateArgumentCount('round', args, 1);
        return args[0].round();

      case 'exp':
        this.validateArgumentCount('exp', args, 1);
        return new Decimal(Math.exp(args[0].toNumber()));

      case 'pow':
        this.validateArgumentCount('pow', args, 2);
        return args[0].pow(args[1]);

      case 'max':
        if (args.length < 2) {
          throw new CalculationError('max函数至少需要2个参数');
        }
        return args.reduce((max, current) => current.gt(max) ? current : max);

      case 'min':
        if (args.length < 2) {
          throw new CalculationError('min函数至少需要2个参数');
        }
        return args.reduce((min, current) => current.lt(min) ? current : min);

      default:
        throw new CalculationError(`不支持的函数: ${functionName}`);
    }
  }

  /**
   * 验证函数参数数量
   */
  private validateArgumentCount(
    functionName: string,
    args: Decimal[],
    expectedCount: number
  ): void {
    if (args.length !== expectedCount) {
      throw new CalculationError(
        `${functionName}函数需要${expectedCount}个参数，但得到${args.length}个`
      );
    }
  }

  /**
   * 简化表达式
   */
  public async simplify(expression: Expression): Promise<Expression> {
    if (!expression.isValid) {
      throw new CalculationError('无法简化无效表达式', expression);
    }

    try {
      // 这里实现基本的表达式简化逻辑
      // 实际项目中可能需要更复杂的符号计算库
      const simplified = this.performBasicSimplification(expression.input);

      return await this.parseExpression(simplified, CalculatorType.BASIC);
    } catch (error) {
      throw new CalculationError(
        `简化失败: ${error instanceof Error ? error.message : '未知错误'}`,
        expression
      );
    }
  }

  /**
   * 执行基本的表达式简化
   */
  private performBasicSimplification(input: string): string {
    let simplified = input;

    // 基本的代数简化规则
    const simplificationRules = [
      // x + x -> 2*x
      { pattern: /(\w+)\s*\+\s*\1(?!\w)/g, replacement: '2*$1' },
      // 2*x + x -> 3*x
      { pattern: /(\d+)\*(\w+)\s*\+\s*\2(?!\w)/g, replacement: (match: string, coeff: string, variable: string) => `${parseInt(coeff) + 1}*${variable}` },
      // x + 2*x -> 3*x
      { pattern: /(\w+)\s*\+\s*(\d+)\*\1(?!\w)/g, replacement: (match: string, variable: string, coeff: string) => `${parseInt(coeff) + 1}*${variable}` },
      // 0 + x -> x
      { pattern: /0\s*\+\s*(\w+)/g, replacement: '$1' },
      // x + 0 -> x
      { pattern: /(\w+)\s*\+\s*0/g, replacement: '$1' },
      // 1 * x -> x
      { pattern: /1\s*\*\s*(\w+)/g, replacement: '$1' },
      // x * 1 -> x
      { pattern: /(\w+)\s*\*\s*1/g, replacement: '$1' },
      // 0 * x -> 0
      { pattern: /0\s*\*\s*\w+/g, replacement: '0' },
      // x * 0 -> 0
      { pattern: /\w+\s*\*\s*0/g, replacement: '0' },
    ];

    for (const rule of simplificationRules) {
      if (typeof rule.replacement === 'string') {
        simplified = simplified.replace(rule.pattern, rule.replacement);
      } else {
        simplified = simplified.replace(rule.pattern as RegExp, rule.replacement as any);
      }
    }

    return simplified.trim();
  }

  /**
   * 求解方程
   */
  public async solve(
    equation: Expression,
    variable: string
  ): Promise<Decimal[]> {
    if (equation.type !== ExpressionType.EQUATION) {
      throw new UnsupportedOperationError('只能求解方程类型的表达式');
    }

    // 分离等号两边
    const parts = equation.input.split('=');
    if (parts.length !== 2) {
      throw new CalculationError('无效的方程格式');
    }

    const leftSide = parts[0].trim();
    const rightSide = parts[1].trim();

    try {
      // 实现基本的线性方程求解
      return this.solveLinearEquation(leftSide, rightSide, variable);
    } catch (error) {
      throw new CalculationError(
        `求解失败: ${error instanceof Error ? error.message : '未知错误'}`,
        equation
      );
    }
  }

  /**
   * 求解线性方程
   */
  private solveLinearEquation(
    leftSide: string,
    rightSide: string,
    variable: string
  ): Decimal[] {
    // 简化的线性方程求解实现
    // 实际项目中需要更复杂的符号计算

    // 处理形如 ax + b = c 的方程
    const pattern = new RegExp(`([-+]?\\d*)\\*?${variable}\\s*([-+]\\s*\\d+)?`);
    const leftMatch = leftSide.match(pattern);

    if (!leftMatch) {
      throw new CalculationError('无法解析方程格式');
    }

    const coefficient = leftMatch[1] ? parseFloat(leftMatch[1]) || 1 : 1;
    const constant = leftMatch[2] ? parseFloat(leftMatch[2].replace(/\s/g, '')) : 0;
    const rightValue = parseFloat(rightSide);

    if (isNaN(rightValue)) {
      throw new CalculationError('等号右边必须是数字');
    }

    if (coefficient === 0) {
      if (constant === rightValue) {
        throw new CalculationError('方程有无穷多解');
      } else {
        throw new CalculationError('方程无解');
      }
    }

    // 求解 ax + b = c => x = (c - b) / a
    const solution = new Decimal(rightValue - constant).dividedBy(coefficient);
    return [solution];
  }

  /**
   * 计算导数
   */
  public async derivative(
    expression: Expression,
    variable: string
  ): Promise<Expression> {
    if (expression.type !== ExpressionType.FUNCTION) {
      throw new UnsupportedOperationError('只能对函数表达式求导');
    }

    // 基本的导数计算规则实现
    const derivativeExpression = this.calculateDerivative(expression.input, variable);

    return await this.parseExpression(derivativeExpression, CalculatorType.SCIENTIFIC);
  }

  /**
   * 计算基本导数
   */
  private calculateDerivative(input: string, variable: string): string {
    // 简化的导数计算实现
    // 实际项目需要完整的符号计算引擎

    // 处理常见的导数规则
    if (input === variable) {
      return '1';
    }

    if (!input.includes(variable)) {
      return '0';
    }

    // x^n -> n*x^(n-1)
    const powerPattern = new RegExp(`${variable}\\^(\\d+)`);
    const powerMatch = input.match(powerPattern);
    if (powerMatch) {
      const exponent = parseInt(powerMatch[1]);
      if (exponent === 1) {
        return '1';
      }
      return `${exponent}*${variable}^${exponent - 1}`;
    }

    // sin(x) -> cos(x)
    if (input === `sin(${variable})`) {
      return `cos(${variable})`;
    }

    // cos(x) -> -sin(x)
    if (input === `cos(${variable})`) {
      return `-sin(${variable})`;
    }

    throw new UnsupportedOperationError(`暂不支持表达式 ${input} 的导数计算`);
  }

  /**
   * 计算积分
   */
  public async integrate(
    expression: Expression,
    variable: string,
    bounds?: { lower: number; upper: number }
  ): Promise<Expression | Decimal> {
    if (expression.type !== ExpressionType.FUNCTION) {
      throw new UnsupportedOperationError('只能对函数表达式积分');
    }

    if (bounds) {
      // 定积分：使用数值积分方法
      return this.numericalIntegration(expression, variable, bounds);
    } else {
      // 不定积分：返回原函数表达式
      const integralExpression = this.calculateIntegral(expression.input, variable);
      return await this.parseExpression(integralExpression, CalculatorType.SCIENTIFIC);
    }
  }

  /**
   * 数值积分（辛普森规则）
   */
  private async numericalIntegration(
    expression: Expression,
    variable: string,
    bounds: { lower: number; upper: number }
  ): Promise<Decimal> {
    const { lower, upper } = bounds;
    const n = 1000; // 分割数量
    const h = (upper - lower) / n;

    let sum = new Decimal(0);

    for (let i = 0; i <= n; i++) {
      const x = lower + i * h;
      const variables = new Map([[variable, x]]);

      // 创建临时表达式进行计算
      const tempExpression = { ...expression, variables };
      const result = await this.evaluate(tempExpression);

      let weight = 1;
      if (i === 0 || i === n) {
        weight = 1;
      } else if (i % 2 === 1) {
        weight = 4;
      } else {
        weight = 2;
      }

      sum = sum.plus(new Decimal(result.value as Decimal).times(weight));
    }

    return sum.times(h / 3);
  }

  /**
   * 计算基本积分
   */
  private calculateIntegral(input: string, variable: string): string {
    // 简化的积分计算实现

    if (!input.includes(variable)) {
      return `${input}*${variable}`;
    }

    if (input === variable) {
      return `${variable}^2/2`;
    }

    // x^n -> x^(n+1)/(n+1)
    const powerPattern = new RegExp(`${variable}\\^(\\d+)`);
    const powerMatch = input.match(powerPattern);
    if (powerMatch) {
      const exponent = parseInt(powerMatch[1]);
      return `${variable}^${exponent + 1}/${exponent + 1}`;
    }

    throw new UnsupportedOperationError(`暂不支持表达式 ${input} 的积分计算`);
  }

  /**
   * 设置计算精度
   */
  public setPrecision(precision: number): void {
    if (precision < 1 || precision > 50) {
      throw new Error('精度必须在1到50之间');
    }

    this.precision = precision;
    this.configureDecimal();
  }

  /**
   * 获取当前精度
   */
  public getPrecision(): number {
    return this.precision;
  }

  /**
   * 获取支持的函数列表
   */
  public getSupportedFunctions(): string[] {
    return [
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
      'ln', 'log', 'sqrt', 'abs', 'ceil', 'floor', 'round',
      'exp', 'pow', 'max', 'min'
    ];
  }

  /**
   * 获取支持的运算符列表
   */
  public getSupportedOperators(): string[] {
    return ['+', '-', '*', '/', '^', '**', '%'];
  }

  /**
   * 获取支持的常数列表
   */
  public getSupportedConstants(): Record<string, number> {
    return {
      'π': Math.PI,
      'e': Math.E,
      'pi': Math.PI,
    };
  }
}