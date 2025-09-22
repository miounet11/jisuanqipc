/**
 * Validation Utilities
 *
 * 输入验证相关的工具函数
 */

import { Expression, CalculatorType, ExpressionType, AngleUnit, NumberFormat } from '@/types';

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 表达式验证结果
export interface ExpressionValidationResult extends ValidationResult {
  suggestedFixes: string[];
  complexity: 'low' | 'medium' | 'high';
}

export class ValidationUtils {
  // 支持的运算符
  private static readonly SUPPORTED_OPERATORS = [
    '+', '-', '*', '/', '^', '**', '%', '=', '==', '!=', '<', '>', '<=', '>='
  ];

  // 支持的函数
  private static readonly SUPPORTED_FUNCTIONS = [
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
    'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
    'ln', 'log', 'log2', 'log10', 'exp', 'sqrt', 'cbrt',
    'abs', 'ceil', 'floor', 'round', 'trunc', 'sign',
    'max', 'min', 'pow', 'random', 'factorial',
    'gamma', 'beta', 'erf', 'erfc'
  ];

  // 支持的常数
  private static readonly SUPPORTED_CONSTANTS = [
    'π', 'pi', 'e', 'φ', 'phi', 'γ', 'gamma'
  ];

  // 危险模式（可能导致性能问题的表达式特征）
  private static readonly DANGEROUS_PATTERNS = [
    /factorial\s*\(\s*[1-9]\d{2,}\s*\)/, // 大数阶乘
    /\^\s*[1-9]\d{2,}/, // 大指数
    /\*{3,}/, // 连续乘号
    /\/{2,}/, // 连续除号
    /\(\s*\)/, // 空括号
  ];

  /**
   * 验证表达式输入
   */
  public static validateExpression(
    input: string,
    calculatorType: CalculatorType = CalculatorType.BASIC
  ): ExpressionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestedFixes: string[] = [];

    // 基本检查
    if (!input || input.trim().length === 0) {
      errors.push('表达式不能为空');
      return {
        isValid: false,
        errors,
        warnings,
        suggestedFixes: ['请输入一个有效的数学表达式'],
        complexity: 'low',
      };
    }

    const trimmedInput = input.trim();

    // 长度检查
    if (trimmedInput.length > 1000) {
      errors.push('表达式长度不能超过1000个字符');
    }

    // 字符检查
    const characterValidation = this.validateCharacters(trimmedInput, calculatorType);
    errors.push(...characterValidation.errors);
    warnings.push(...characterValidation.warnings);
    suggestedFixes.push(...characterValidation.suggestedFixes);

    // 语法检查
    const syntaxValidation = this.validateSyntax(trimmedInput);
    errors.push(...syntaxValidation.errors);
    warnings.push(...syntaxValidation.warnings);
    suggestedFixes.push(...syntaxValidation.suggestedFixes);

    // 括号检查
    const parenthesesValidation = this.validateParentheses(trimmedInput);
    errors.push(...parenthesesValidation.errors);
    warnings.push(...parenthesesValidation.warnings);
    suggestedFixes.push(...parenthesesValidation.suggestedFixes);

    // 函数检查
    const functionValidation = this.validateFunctions(trimmedInput, calculatorType);
    errors.push(...functionValidation.errors);
    warnings.push(...functionValidation.warnings);
    suggestedFixes.push(...functionValidation.suggestedFixes);

    // 性能检查
    const performanceValidation = this.validatePerformance(trimmedInput);
    warnings.push(...performanceValidation.warnings);
    suggestedFixes.push(...performanceValidation.suggestedFixes);

    // 复杂度评估
    const complexity = this.assessComplexity(trimmedInput);

    return {
      isValid: errors.length === 0,
      errors: [...new Set(errors)], // 去重
      warnings: [...new Set(warnings)],
      suggestedFixes: [...new Set(suggestedFixes)],
      complexity,
    };
  }

  /**
   * 验证字符
   */
  private static validateCharacters(
    input: string,
    calculatorType: CalculatorType
  ): { errors: string[]; warnings: string[]; suggestedFixes: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestedFixes: string[] = [];

    // 基本字符集
    let allowedPattern = /^[0-9a-zA-Z+\-*/().,\s\^=<>!πe]+$/;

    // 根据计算器类型扩展字符集
    switch (calculatorType) {
      case CalculatorType.SCIENTIFIC:
        allowedPattern = /^[0-9a-zA-Z+\-*/().,\s\^=<>!πeφγ_]+$/;
        break;
      case CalculatorType.MATRIX:
        allowedPattern = /^[0-9a-zA-Z+\-*/().,\s\^=<>!πe\[\]]+$/;
        break;
    }

    if (!allowedPattern.test(input)) {
      const invalidChars = input.split('').filter(char => !allowedPattern.test(char));
      errors.push(`包含不支持的字符: ${[...new Set(invalidChars)].join(', ')}`);
      suggestedFixes.push('请只使用支持的数学字符和函数');
    }

    // 检查连续运算符
    if (/[+\-*/^]{2,}/.test(input)) {
      errors.push('不能有连续的运算符');
      suggestedFixes.push('请检查运算符的使用，确保每个运算符之间有操作数');
    }

    // 检查运算符位置
    if (/^[*/^]/.test(input)) {
      errors.push('表达式不能以乘法、除法或幂运算符开头');
      suggestedFixes.push('请在运算符前添加操作数');
    }

    if (/[*/^]$/.test(input)) {
      errors.push('表达式不能以乘法、除法或幂运算符结尾');
      suggestedFixes.push('请在运算符后添加操作数');
    }

    return { errors, warnings, suggestedFixes };
  }

  /**
   * 验证语法
   */
  private static validateSyntax(
    input: string
  ): { errors: string[]; warnings: string[]; suggestedFixes: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestedFixes: string[] = [];

    // 检查数字格式
    const numberPattern = /\b\d+\.?\d*\b/g;
    const numbers = input.match(numberPattern) || [];

    for (const number of numbers) {
      if ((number.match(/\./g) || []).length > 1) {
        errors.push(`无效的数字格式: ${number}`);
        suggestedFixes.push('请确保数字只包含一个小数点');
      }

      // 检查过大的数字
      const numValue = parseFloat(number);
      if (numValue > Number.MAX_SAFE_INTEGER) {
        warnings.push(`数字 ${number} 可能过大，可能导致精度损失`);
        suggestedFixes.push('考虑使用科学计数法表示大数');
      }
    }

    // 检查变量名
    const variablePattern = /\b[a-zA-Z][a-zA-Z0-9_]*\b/g;
    const variables = input.match(variablePattern) || [];

    for (const variable of variables) {
      // 排除已知函数和常数
      if (
        !this.SUPPORTED_FUNCTIONS.includes(variable.toLowerCase()) &&
        !this.SUPPORTED_CONSTANTS.includes(variable.toLowerCase())
      ) {
        if (variable.length > 20) {
          warnings.push(`变量名 ${variable} 过长`);
          suggestedFixes.push('使用较短的变量名以提高可读性');
        }

        if (!/^[a-zA-Z]/.test(variable)) {
          errors.push(`变量名 ${variable} 必须以字母开头`);
        }
      }
    }

    return { errors, warnings, suggestedFixes };
  }

  /**
   * 验证括号
   */
  private static validateParentheses(
    input: string
  ): { errors: string[]; warnings: string[]; suggestedFixes: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestedFixes: string[] = [];

    const stack: string[] = [];
    let position = 0;

    for (const char of input) {
      if (char === '(') {
        stack.push(char);
      } else if (char === ')') {
        if (stack.length === 0) {
          errors.push(`位置 ${position} 处有多余的右括号`);
          suggestedFixes.push('请移除多余的右括号或添加对应的左括号');
          break;
        }
        stack.pop();
      }
      position++;
    }

    if (stack.length > 0) {
      errors.push(`缺少 ${stack.length} 个右括号`);
      suggestedFixes.push('请添加缺少的右括号');
    }

    // 检查空括号
    if (/\(\s*\)/.test(input)) {
      errors.push('不能有空括号');
      suggestedFixes.push('请在括号内添加有效的表达式或移除空括号');
    }

    // 检查嵌套深度
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of input) {
      if (char === '(') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === ')') {
        currentDepth--;
      }
    }

    if (maxDepth > 10) {
      warnings.push('括号嵌套过深，可能影响性能');
      suggestedFixes.push('考虑简化表达式或使用变量替换复杂的子表达式');
    }

    return { errors, warnings, suggestedFixes };
  }

  /**
   * 验证函数
   */
  private static validateFunctions(
    input: string,
    calculatorType: CalculatorType
  ): { errors: string[]; warnings: string[]; suggestedFixes: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestedFixes: string[] = [];

    // 提取函数调用
    const functionPattern = /([a-zA-Z]+)\s*\(/g;
    let match;

    while ((match = functionPattern.exec(input)) !== null) {
      const functionName = match[1].toLowerCase();

      if (!this.SUPPORTED_FUNCTIONS.includes(functionName)) {
        // 检查是否为常见的拼写错误
        const suggestions = this.suggestFunctionNames(functionName);
        if (suggestions.length > 0) {
          errors.push(`未知函数: ${functionName}`);
          suggestedFixes.push(`您是否想使用: ${suggestions.join(', ')}？`);
        } else {
          errors.push(`不支持的函数: ${functionName}`);
          suggestedFixes.push('请使用支持的数学函数');
        }
      }

      // 检查计算器类型限制
      if (calculatorType === CalculatorType.BASIC) {
        const basicFunctions = ['abs', 'ceil', 'floor', 'round', 'max', 'min', 'pow', 'sqrt'];
        if (!basicFunctions.includes(functionName)) {
          warnings.push(`函数 ${functionName} 在基础计算器模式下可能不可用`);
          suggestedFixes.push('切换到科学计算器模式以使用高级函数');
        }
      }
    }

    return { errors, warnings, suggestedFixes };
  }

  /**
   * 验证性能影响
   */
  private static validatePerformance(
    input: string
  ): { warnings: string[]; suggestedFixes: string[] } {
    const warnings: string[] = [];
    const suggestedFixes: string[] = [];

    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(input)) {
        warnings.push('检测到可能影响性能的表达式模式');
        suggestedFixes.push('考虑简化表达式或使用更小的数值');
        break;
      }
    }

    // 检查递归函数调用
    const functionCalls = (input.match(/([a-zA-Z]+)\s*\(/g) || []).length;
    if (functionCalls > 20) {
      warnings.push('函数调用过多，可能影响计算性能');
      suggestedFixes.push('考虑简化表达式或分解为多个步骤');
    }

    // 检查表达式长度
    if (input.length > 200) {
      warnings.push('表达式过长，可能影响计算性能');
      suggestedFixes.push('考虑将复杂表达式分解为多个简单表达式');
    }

    return { warnings, suggestedFixes };
  }

  /**
   * 评估表达式复杂度
   */
  private static assessComplexity(input: string): 'low' | 'medium' | 'high' {
    let score = 0;

    // 长度权重
    score += Math.floor(input.length / 50);

    // 运算符数量
    const operators = input.match(/[+\-*/^=<>!]/g) || [];
    score += operators.length;

    // 函数调用数量
    const functions = input.match(/[a-zA-Z]+\s*\(/g) || [];
    score += functions.length * 2;

    // 括号嵌套深度
    let depth = 0;
    let maxDepth = 0;
    for (const char of input) {
      if (char === '(') depth++;
      else if (char === ')') depth--;
      maxDepth = Math.max(maxDepth, depth);
    }
    score += maxDepth;

    // 数字的数量和大小
    const numbers = input.match(/\d+\.?\d*/g) || [];
    score += numbers.length;
    for (const num of numbers) {
      if (parseFloat(num) > 1000) score++;
    }

    if (score <= 5) return 'low';
    if (score <= 15) return 'medium';
    return 'high';
  }

  /**
   * 建议函数名（基于编辑距离）
   */
  private static suggestFunctionNames(input: string): string[] {
    const suggestions: string[] = [];

    for (const func of this.SUPPORTED_FUNCTIONS) {
      const distance = this.levenshteinDistance(input, func);
      if (distance <= 2 && func.length > 2) {
        suggestions.push(func);
      }
    }

    return suggestions.slice(0, 3); // 最多返回3个建议
  }

  /**
   * 计算编辑距离
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // 替换
            matrix[i][j - 1] + 1,     // 插入
            matrix[i - 1][j] + 1      // 删除
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 验证数值
   */
  public static validateNumber(
    value: string,
    options: {
      min?: number;
      max?: number;
      allowFloat?: boolean;
      allowNegative?: boolean;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const {
      min,
      max,
      allowFloat = true,
      allowNegative = true,
    } = options;

    // 检查是否为空
    if (!value || value.trim().length === 0) {
      errors.push('数值不能为空');
      return { isValid: false, errors, warnings };
    }

    // 检查数值格式
    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      errors.push('无效的数值格式');
      return { isValid: false, errors, warnings };
    }

    // 检查是否允许负数
    if (!allowNegative && numValue < 0) {
      errors.push('不允许负数');
    }

    // 检查是否允许小数
    if (!allowFloat && !Number.isInteger(numValue)) {
      errors.push('不允许小数');
    }

    // 检查范围
    if (min !== undefined && numValue < min) {
      errors.push(`数值不能小于 ${min}`);
    }

    if (max !== undefined && numValue > max) {
      errors.push(`数值不能大于 ${max}`);
    }

    // 检查精度损失
    if (Math.abs(numValue) > Number.MAX_SAFE_INTEGER) {
      warnings.push('数值过大，可能存在精度损失');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证角度单位
   */
  public static validateAngleUnit(unit: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Object.values(AngleUnit).includes(unit as AngleUnit)) {
      errors.push(`无效的角度单位: ${unit}`);
      return { isValid: false, errors, warnings };
    }

    return { isValid: true, errors, warnings };
  }

  /**
   * 验证数字格式
   */
  public static validateNumberFormat(format: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Object.values(NumberFormat).includes(format as NumberFormat)) {
      errors.push(`无效的数字格式: ${format}`);
      return { isValid: false, errors, warnings };
    }

    return { isValid: true, errors, warnings };
  }

  /**
   * 验证精度设置
   */
  public static validatePrecision(precision: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Number.isInteger(precision)) {
      errors.push('精度必须是整数');
    }

    if (precision < 1) {
      errors.push('精度不能小于1');
    }

    if (precision > 50) {
      errors.push('精度不能大于50');
    }

    if (precision > 20) {
      warnings.push('高精度设置可能影响计算性能');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证变量名
   */
  public static validateVariableName(name: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('变量名不能为空');
      return { isValid: false, errors, warnings };
    }

    const trimmedName = name.trim();

    // 检查长度
    if (trimmedName.length > 50) {
      errors.push('变量名长度不能超过50个字符');
    }

    // 检查格式
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedName)) {
      errors.push('变量名必须以字母开头，只能包含字母、数字和下划线');
    }

    // 检查是否为保留字
    const reservedWords = [
      ...this.SUPPORTED_FUNCTIONS,
      ...this.SUPPORTED_CONSTANTS,
      'true', 'false', 'null', 'undefined',
    ];

    if (reservedWords.includes(trimmedName.toLowerCase())) {
      errors.push(`"${trimmedName}" 是保留字，不能用作变量名`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证表达式类型兼容性
   */
  public static validateExpressionTypeCompatibility(
    expression: Expression,
    expectedType: ExpressionType
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (expression.type !== expectedType) {
      errors.push(`表达式类型不匹配，期望 ${expectedType}，实际为 ${expression.type}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 批量验证
   */
  public static validateBatch(
    validations: Array<() => ValidationResult>
  ): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const validation of validations) {
      const result = validation();
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: [...new Set(allErrors)],
      warnings: [...new Set(allWarnings)],
    };
  }

  /**
   * 获取验证器信息
   */
  public static getValidatorInfo(): {
    supportedOperators: string[];
    supportedFunctions: string[];
    supportedConstants: string[];
    version: string;
  } {
    return {
      supportedOperators: [...this.SUPPORTED_OPERATORS],
      supportedFunctions: [...this.SUPPORTED_FUNCTIONS],
      supportedConstants: [...this.SUPPORTED_CONSTANTS],
      version: '1.0.0',
    };
  }
}