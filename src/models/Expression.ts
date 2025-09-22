/**
 * Expression Model
 *
 * 数学表达式的模型实现，包含验证、解析和状态管理
 */

import {
  Expression,
  Token,
  TokenType,
  ASTNode,
  ExpressionType,
  ExpressionState,
  ValidationRule,
  ParseOptions,
} from '@/types';
// 简化的UUID生成器，避免外部依赖
const generateUUID = (): string => {
  return 'expr-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
};

export class ExpressionModel implements Expression {
  public readonly id: string;
  public readonly input: string;
  public tokens: Token[];
  public ast: ASTNode | null;
  public isValid: boolean;
  public errorMessage: string | null;
  public readonly type: ExpressionType;
  public readonly createdAt: Date;
  public variables: Map<string, number>;
  private state: ExpressionState;

  constructor(
    input: string,
    type: ExpressionType = ExpressionType.ARITHMETIC,
    id?: string
  ) {
    this.id = id || generateUUID();
    this.input = input.trim();
    this.tokens = [];
    this.ast = null;
    this.isValid = false;
    this.errorMessage = null;
    this.type = type;
    this.createdAt = new Date();
    this.variables = new Map();
    this.state = {
      phase: 'created',
      timestamp: new Date(),
    };

    this.validate();
  }

  /**
   * 验证表达式的基本规则
   */
  private validate(): void {
    const rules = this.getValidationRules();

    for (const rule of rules) {
      if (!rule.check(this)) {
        this.isValid = false;
        this.errorMessage = rule.errorMessage;
        this.updateState('invalid');
        return;
      }
    }

    this.isValid = true;
    this.errorMessage = null;
    this.updateState('valid');
  }

  /**
   * 获取验证规则
   */
  private getValidationRules(): ValidationRule[] {
    return [
      {
        check: (expr) => expr.input.length > 0,
        errorMessage: '表达式不能为空',
      },
      {
        check: (expr) => expr.input.length <= 1000,
        errorMessage: '表达式长度不能超过1000个字符',
      },
      {
        check: (expr) => this.hasValidCharacters(expr.input),
        errorMessage: '表达式包含无效字符',
      },
      {
        check: (expr) => this.hasBalancedParentheses(expr.input),
        errorMessage: '括号不匹配',
      },
    ];
  }

  /**
   * 检查是否包含有效字符
   */
  private hasValidCharacters(input: string): boolean {
    const validPattern = /^[0-9a-zA-Z+\-*/().,\s\^πe sin cos tan ln log sqrt abs]+$/;
    return validPattern.test(input);
  }

  /**
   * 检查括号是否平衡
   */
  private hasBalancedParentheses(input: string): boolean {
    let count = 0;
    for (const char of input) {
      if (char === '(') count++;
      if (char === ')') count--;
      if (count < 0) return false;
    }
    return count === 0;
  }

  /**
   * 词法分析
   */
  public tokenize(options: ParseOptions = {}): Token[] {
    if (!this.isValid) {
      throw new Error('无法对无效表达式进行词法分析');
    }

    this.updateState('parsing');
    this.tokens = [];

    let position = 0;
    const input = this.input;

    while (position < input.length) {
      const char = input[position];

      // 跳过空白字符
      if (/\s/.test(char)) {
        position++;
        continue;
      }

      // 数字
      if (/\d/.test(char)) {
        const token = this.parseNumber(input, position);
        this.tokens.push(token);
        position = token.position + token.value.length;
        continue;
      }

      // 操作符
      if (/[+\-*/^]/.test(char)) {
        this.tokens.push({
          type: TokenType.OPERATOR,
          value: char,
          position,
        });
        position++;
        continue;
      }

      // 括号
      if (/[()]/.test(char)) {
        this.tokens.push({
          type: TokenType.PARENTHESIS,
          value: char,
          position,
        });
        position++;
        continue;
      }

      // 函数和变量
      if (/[a-zA-Z]/.test(char)) {
        const token = this.parseIdentifier(input, position);
        this.tokens.push(token);
        position = token.position + token.value.length;
        continue;
      }

      // 常数
      if (char === 'π' || char === 'e') {
        this.tokens.push({
          type: TokenType.CONSTANT,
          value: char,
          position,
        });
        position++;
        continue;
      }

      // 未知字符
      this.tokens.push({
        type: TokenType.UNKNOWN,
        value: char,
        position,
      });
      position++;
    }

    return this.tokens;
  }

  /**
   * 解析数字
   */
  private parseNumber(input: string, startPos: number): Token {
    let value = '';
    let position = startPos;

    while (position < input.length && /[\d.]/.test(input[position])) {
      value += input[position];
      position++;
    }

    return {
      type: TokenType.NUMBER,
      value,
      position: startPos,
    };
  }

  /**
   * 解析标识符（函数名或变量名）
   */
  private parseIdentifier(input: string, startPos: number): Token {
    let value = '';
    let position = startPos;

    while (position < input.length && /[a-zA-Z]/.test(input[position])) {
      value += input[position];
      position++;
    }

    const functions = ['sin', 'cos', 'tan', 'ln', 'log', 'sqrt', 'abs'];
    const type = functions.includes(value.toLowerCase())
      ? TokenType.FUNCTION
      : TokenType.VARIABLE;

    return {
      type,
      value,
      position: startPos,
    };
  }

  /**
   * 语法分析，构建AST
   */
  public parse(): ASTNode | null {
    if (this.tokens.length === 0) {
      this.tokenize();
    }

    if (this.tokens.length === 0) {
      return null;
    }

    try {
      this.ast = this.parseExpression(0);
      this.updateState('valid');
      return this.ast;
    } catch (error) {
      this.isValid = false;
      this.errorMessage = error instanceof Error ? error.message : '语法分析失败';
      this.updateState('invalid');
      return null;
    }
  }

  /**
   * 递归下降解析器
   */
  private parseExpression(tokenIndex: number): ASTNode {
    // 简化的表达式解析器实现
    // 实际实现会更复杂，需要处理运算符优先级等

    if (tokenIndex >= this.tokens.length) {
      throw new Error('意外的表达式结束');
    }

    const token = this.tokens[tokenIndex];

    switch (token.type) {
      case TokenType.NUMBER:
        return {
          type: 'number',
          value: parseFloat(token.value),
          position: token.position,
        };

      case TokenType.VARIABLE:
        return {
          type: 'variable',
          value: token.value,
          position: token.position,
        };

      case TokenType.FUNCTION:
        return this.parseFunction(tokenIndex);

      default:
        throw new Error(`意外的token类型: ${token.type}`);
    }
  }

  /**
   * 解析函数调用
   */
  private parseFunction(tokenIndex: number): ASTNode {
    const functionToken = this.tokens[tokenIndex];

    if (tokenIndex + 1 >= this.tokens.length ||
        this.tokens[tokenIndex + 1].value !== '(') {
      throw new Error('函数调用缺少左括号');
    }

    // 简化实现，假设函数只有一个参数
    const argument = this.parseExpression(tokenIndex + 2);

    return {
      type: 'function',
      value: functionToken.value,
      children: [argument],
      position: functionToken.position,
    };
  }

  /**
   * 设置变量值
   */
  public setVariable(name: string, value: number): void {
    this.variables.set(name, value);
  }

  /**
   * 获取变量值
   */
  public getVariable(name: string): number | undefined {
    return this.variables.get(name);
  }

  /**
   * 清除所有变量
   */
  public clearVariables(): void {
    this.variables.clear();
  }

  /**
   * 更新状态
   */
  private updateState(phase: ExpressionState['phase']): void {
    this.state = {
      phase,
      timestamp: new Date(),
      metadata: {
        tokenCount: this.tokens.length,
        hasVariables: this.variables.size > 0,
      },
    };
  }

  /**
   * 获取当前状态
   */
  public getState(): ExpressionState {
    return { ...this.state };
  }

  /**
   * 克隆表达式
   */
  public clone(): ExpressionModel {
    const cloned = new ExpressionModel(this.input, this.type);
    cloned.tokens = [...this.tokens];
    cloned.ast = this.ast ? { ...this.ast } : null;
    cloned.isValid = this.isValid;
    cloned.errorMessage = this.errorMessage;
    cloned.variables = new Map(this.variables);
    return cloned;
  }

  /**
   * 序列化为JSON
   */
  public toJSON(): Expression {
    return {
      id: this.id,
      input: this.input,
      tokens: this.tokens,
      ast: this.ast,
      isValid: this.isValid,
      errorMessage: this.errorMessage,
      type: this.type,
      createdAt: this.createdAt,
      variables: this.variables,
    };
  }

  /**
   * 从JSON反序列化
   */
  public static fromJSON(data: Expression): ExpressionModel {
    const expression = new ExpressionModel(data.input, data.type, data.id);
    expression.tokens = data.tokens;
    expression.ast = data.ast;
    expression.isValid = data.isValid;
    expression.errorMessage = data.errorMessage;
    expression.variables = new Map(data.variables);
    return expression;
  }
}