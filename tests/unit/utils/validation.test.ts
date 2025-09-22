/**
 * Validation Utils Unit Tests
 *
 * 验证工具函数单元测试
 */

import { ValidationUtils } from '@/utils/validation';

describe('ValidationUtils', () => {
  describe('Number Validation', () => {
    test('should validate numbers correctly', () => {
      expect(ValidationUtils.isValidNumber('123')).toBe(true);
      expect(ValidationUtils.isValidNumber('123.456')).toBe(true);
      expect(ValidationUtils.isValidNumber('-123')).toBe(true);
      expect(ValidationUtils.isValidNumber('-123.456')).toBe(true);
      expect(ValidationUtils.isValidNumber('0')).toBe(true);
      expect(ValidationUtils.isValidNumber('0.0')).toBe(true);
      expect(ValidationUtils.isValidNumber('.5')).toBe(true);
      expect(ValidationUtils.isValidNumber('5.')).toBe(true);
    });

    test('should reject invalid numbers', () => {
      expect(ValidationUtils.isValidNumber('')).toBe(false);
      expect(ValidationUtils.isValidNumber('abc')).toBe(false);
      expect(ValidationUtils.isValidNumber('12.34.56')).toBe(false);
      expect(ValidationUtils.isValidNumber('++123')).toBe(false);
      expect(ValidationUtils.isValidNumber('--123')).toBe(false);
      expect(ValidationUtils.isValidNumber('1.2.3')).toBe(false);
      expect(ValidationUtils.isValidNumber('1e')).toBe(false);
      expect(ValidationUtils.isValidNumber('e10')).toBe(false);
    });

    test('should validate scientific notation', () => {
      expect(ValidationUtils.isValidNumber('1e10')).toBe(true);
      expect(ValidationUtils.isValidNumber('1.5e10')).toBe(true);
      expect(ValidationUtils.isValidNumber('1e-10')).toBe(true);
      expect(ValidationUtils.isValidNumber('1.5e-10')).toBe(true);
      expect(ValidationUtils.isValidNumber('-1e10')).toBe(true);
      expect(ValidationUtils.isValidNumber('-1.5e-10')).toBe(true);
    });

    test('should validate integer specifically', () => {
      expect(ValidationUtils.isValidInteger('123')).toBe(true);
      expect(ValidationUtils.isValidInteger('-123')).toBe(true);
      expect(ValidationUtils.isValidInteger('0')).toBe(true);
      expect(ValidationUtils.isValidInteger('123.0')).toBe(false);
      expect(ValidationUtils.isValidInteger('123.456')).toBe(false);
      expect(ValidationUtils.isValidInteger('abc')).toBe(false);
    });

    test('should validate positive numbers', () => {
      expect(ValidationUtils.isValidPositiveNumber('123')).toBe(true);
      expect(ValidationUtils.isValidPositiveNumber('123.456')).toBe(true);
      expect(ValidationUtils.isValidPositiveNumber('0.001')).toBe(true);
      expect(ValidationUtils.isValidPositiveNumber('0')).toBe(false);
      expect(ValidationUtils.isValidPositiveNumber('-123')).toBe(false);
    });
  });

  describe('Expression Validation', () => {
    test('should validate basic expressions', () => {
      expect(ValidationUtils.isValidExpression('2 + 3')).toBe(true);
      expect(ValidationUtils.isValidExpression('10 - 5')).toBe(true);
      expect(ValidationUtils.isValidExpression('4 * 6')).toBe(true);
      expect(ValidationUtils.isValidExpression('8 / 2')).toBe(true);
      expect(ValidationUtils.isValidExpression('2 ^ 3')).toBe(true);
    });

    test('should validate expressions with parentheses', () => {
      expect(ValidationUtils.isValidExpression('(2 + 3) * 4')).toBe(true);
      expect(ValidationUtils.isValidExpression('((2 + 3) * 4) - 5')).toBe(true);
      expect(ValidationUtils.isValidExpression('2 * (3 + 4)')).toBe(true);
    });

    test('should validate expressions with functions', () => {
      expect(ValidationUtils.isValidExpression('sin(30)')).toBe(true);
      expect(ValidationUtils.isValidExpression('cos(0)')).toBe(true);
      expect(ValidationUtils.isValidExpression('log(100)')).toBe(true);
      expect(ValidationUtils.isValidExpression('sqrt(16)')).toBe(true);
      expect(ValidationUtils.isValidExpression('sin(cos(0))')).toBe(true);
    });

    test('should validate expressions with constants', () => {
      expect(ValidationUtils.isValidExpression('2 * pi')).toBe(true);
      expect(ValidationUtils.isValidExpression('e ^ 2')).toBe(true);
      expect(ValidationUtils.isValidExpression('pi + e')).toBe(true);
    });

    test('should reject invalid expressions', () => {
      expect(ValidationUtils.isValidExpression('')).toBe(false);
      expect(ValidationUtils.isValidExpression('2 +')).toBe(false);
      expect(ValidationUtils.isValidExpression('* 3')).toBe(false);
      expect(ValidationUtils.isValidExpression('2 + + 3')).toBe(false);
      expect(ValidationUtils.isValidExpression('(2 + 3')).toBe(false);
      expect(ValidationUtils.isValidExpression('2 + 3)')).toBe(false);
      expect(ValidationUtils.isValidExpression('sin(')).toBe(false);
      expect(ValidationUtils.isValidExpression('sin)')).toBe(false);
    });

    test('should check parentheses balance', () => {
      expect(ValidationUtils.isBalancedParentheses('(2 + 3)')).toBe(true);
      expect(ValidationUtils.isBalancedParentheses('((2 + 3) * 4)')).toBe(true);
      expect(ValidationUtils.isBalancedParentheses('(2 + (3 * 4))')).toBe(true);
      expect(ValidationUtils.isBalancedParentheses('2 + 3')).toBe(true); // No parentheses

      expect(ValidationUtils.isBalancedParentheses('(2 + 3')).toBe(false);
      expect(ValidationUtils.isBalancedParentheses('2 + 3)')).toBe(false);
      expect(ValidationUtils.isBalancedParentheses('((2 + 3)')).toBe(false);
      expect(ValidationUtils.isBalancedParentheses(')2 + 3(')).toBe(false);
    });
  });

  describe('Function Name Validation', () => {
    test('should validate known function names', () => {
      const validFunctions = [
        'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
        'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
        'log', 'ln', 'exp', 'sqrt', 'cbrt', 'abs',
        'ceil', 'floor', 'round', 'factorial'
      ];

      validFunctions.forEach(func => {
        expect(ValidationUtils.isValidFunction(func)).toBe(true);
      });
    });

    test('should reject invalid function names', () => {
      expect(ValidationUtils.isValidFunction('invalid')).toBe(false);
      expect(ValidationUtils.isValidFunction('func123')).toBe(false);
      expect(ValidationUtils.isValidFunction('')).toBe(false);
      expect(ValidationUtils.isValidFunction('123sin')).toBe(false);
    });
  });

  describe('Operator Validation', () => {
    test('should validate arithmetic operators', () => {
      expect(ValidationUtils.isValidOperator('+')).toBe(true);
      expect(ValidationUtils.isValidOperator('-')).toBe(true);
      expect(ValidationUtils.isValidOperator('*')).toBe(true);
      expect(ValidationUtils.isValidOperator('/')).toBe(true);
      expect(ValidationUtils.isValidOperator('^')).toBe(true);
      expect(ValidationUtils.isValidOperator('%')).toBe(true);
    });

    test('should reject invalid operators', () => {
      expect(ValidationUtils.isValidOperator('=')).toBe(false);
      expect(ValidationUtils.isValidOperator('&')).toBe(false);
      expect(ValidationUtils.isValidOperator('|')).toBe(false);
      expect(ValidationUtils.isValidOperator('')).toBe(false);
      expect(ValidationUtils.isValidOperator('+++')).toBe(false);
    });

    test('should check operator precedence', () => {
      expect(ValidationUtils.getOperatorPrecedence('+')).toBe(1);
      expect(ValidationUtils.getOperatorPrecedence('-')).toBe(1);
      expect(ValidationUtils.getOperatorPrecedence('*')).toBe(2);
      expect(ValidationUtils.getOperatorPrecedence('/')).toBe(2);
      expect(ValidationUtils.getOperatorPrecedence('^')).toBe(3);
      expect(ValidationUtils.getOperatorPrecedence('%')).toBe(2);
    });
  });

  describe('Variable and Constant Validation', () => {
    test('should validate mathematical constants', () => {
      expect(ValidationUtils.isValidConstant('pi')).toBe(true);
      expect(ValidationUtils.isValidConstant('e')).toBe(true);
      expect(ValidationUtils.isValidConstant('phi')).toBe(true);
      expect(ValidationUtils.isValidConstant('ans')).toBe(true);
    });

    test('should validate variable names', () => {
      expect(ValidationUtils.isValidVariable('x')).toBe(true);
      expect(ValidationUtils.isValidVariable('y')).toBe(true);
      expect(ValidationUtils.isValidVariable('z')).toBe(true);
      expect(ValidationUtils.isValidVariable('var1')).toBe(true);
      expect(ValidationUtils.isValidVariable('variable_name')).toBe(true);
    });

    test('should reject invalid variable names', () => {
      expect(ValidationUtils.isValidVariable('123')).toBe(false);
      expect(ValidationUtils.isValidVariable('123var')).toBe(false);
      expect(ValidationUtils.isValidVariable('')).toBe(false);
      expect(ValidationUtils.isValidVariable('var-name')).toBe(false);
      expect(ValidationUtils.isValidVariable('var name')).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize mathematical expressions', () => {
      expect(ValidationUtils.sanitizeExpression('  2 + 3  ')).toBe('2 + 3');
      expect(ValidationUtils.sanitizeExpression('2×3')).toBe('2*3');
      expect(ValidationUtils.sanitizeExpression('2÷3')).toBe('2/3');
      expect(ValidationUtils.sanitizeExpression('2**3')).toBe('2^3');
      expect(ValidationUtils.sanitizeExpression('SIN(30)')).toBe('sin(30)');
    });

    test('should remove invalid characters', () => {
      expect(ValidationUtils.sanitizeExpression('2+3@#$')).toBe('2+3');
      expect(ValidationUtils.sanitizeExpression('2+3;')).toBe('2+3');
      expect(ValidationUtils.sanitizeExpression('2+3\n')).toBe('2+3');
      expect(ValidationUtils.sanitizeExpression('2+3\t')).toBe('2+3');
    });

    test('should normalize function names', () => {
      expect(ValidationUtils.sanitizeExpression('SIN(x)')).toBe('sin(x)');
      expect(ValidationUtils.sanitizeExpression('COS(x)')).toBe('cos(x)');
      expect(ValidationUtils.sanitizeExpression('LOG(x)')).toBe('log(x)');
    });
  });

  describe('Range Validation', () => {
    test('should validate numbers within range', () => {
      expect(ValidationUtils.isInRange(5, 1, 10)).toBe(true);
      expect(ValidationUtils.isInRange(1, 1, 10)).toBe(true);
      expect(ValidationUtils.isInRange(10, 1, 10)).toBe(true);
      expect(ValidationUtils.isInRange(0, 1, 10)).toBe(false);
      expect(ValidationUtils.isInRange(11, 1, 10)).toBe(false);
    });

    test('should validate angles', () => {
      expect(ValidationUtils.isValidAngle(0, 'degree')).toBe(true);
      expect(ValidationUtils.isValidAngle(180, 'degree')).toBe(true);
      expect(ValidationUtils.isValidAngle(360, 'degree')).toBe(true);
      expect(ValidationUtils.isValidAngle(-180, 'degree')).toBe(true);

      expect(ValidationUtils.isValidAngle(0, 'radian')).toBe(true);
      expect(ValidationUtils.isValidAngle(Math.PI, 'radian')).toBe(true);
      expect(ValidationUtils.isValidAngle(2 * Math.PI, 'radian')).toBe(true);
    });

    test('should validate percentage values', () => {
      expect(ValidationUtils.isValidPercentage(0)).toBe(true);
      expect(ValidationUtils.isValidPercentage(50)).toBe(true);
      expect(ValidationUtils.isValidPercentage(100)).toBe(true);
      expect(ValidationUtils.isValidPercentage(-1)).toBe(false);
      expect(ValidationUtils.isValidPercentage(101)).toBe(false);
    });
  });

  describe('Type Validation', () => {
    test('should validate data types', () => {
      expect(ValidationUtils.isString('hello')).toBe(true);
      expect(ValidationUtils.isString(123)).toBe(false);
      expect(ValidationUtils.isString('')).toBe(true);

      expect(ValidationUtils.isNumber(123)).toBe(true);
      expect(ValidationUtils.isNumber('123')).toBe(false);
      expect(ValidationUtils.isNumber(NaN)).toBe(false);

      expect(ValidationUtils.isBoolean(true)).toBe(true);
      expect(ValidationUtils.isBoolean(false)).toBe(true);
      expect(ValidationUtils.isBoolean('true')).toBe(false);

      expect(ValidationUtils.isArray([1, 2, 3])).toBe(true);
      expect(ValidationUtils.isArray([])).toBe(true);
      expect(ValidationUtils.isArray('array')).toBe(false);

      expect(ValidationUtils.isObject({})).toBe(true);
      expect(ValidationUtils.isObject({ a: 1 })).toBe(true);
      expect(ValidationUtils.isObject(null)).toBe(false);
      expect(ValidationUtils.isObject([])).toBe(false);
    });

    test('should check for null and undefined', () => {
      expect(ValidationUtils.isNull(null)).toBe(true);
      expect(ValidationUtils.isNull(undefined)).toBe(false);
      expect(ValidationUtils.isNull(0)).toBe(false);
      expect(ValidationUtils.isNull('')).toBe(false);

      expect(ValidationUtils.isUndefined(undefined)).toBe(true);
      expect(ValidationUtils.isUndefined(null)).toBe(false);
      expect(ValidationUtils.isUndefined(0)).toBe(false);

      expect(ValidationUtils.isNullOrUndefined(null)).toBe(true);
      expect(ValidationUtils.isNullOrUndefined(undefined)).toBe(true);
      expect(ValidationUtils.isNullOrUndefined(0)).toBe(false);
      expect(ValidationUtils.isNullOrUndefined('')).toBe(false);
    });
  });

  describe('Format Validation', () => {
    test('should validate email format', () => {
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(ValidationUtils.isValidEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(ValidationUtils.isValidEmail('invalid.email')).toBe(false);
      expect(ValidationUtils.isValidEmail('@example.com')).toBe(false);
      expect(ValidationUtils.isValidEmail('test@')).toBe(false);
    });

    test('should validate phone number format', () => {
      expect(ValidationUtils.isValidPhoneNumber('+1234567890')).toBe(true);
      expect(ValidationUtils.isValidPhoneNumber('123-456-7890')).toBe(true);
      expect(ValidationUtils.isValidPhoneNumber('(123) 456-7890')).toBe(true);
      expect(ValidationUtils.isValidPhoneNumber('123')).toBe(false);
      expect(ValidationUtils.isValidPhoneNumber('abc123')).toBe(false);
    });

    test('should validate URL format', () => {
      expect(ValidationUtils.isValidURL('https://example.com')).toBe(true);
      expect(ValidationUtils.isValidURL('http://example.com')).toBe(true);
      expect(ValidationUtils.isValidURL('ftp://example.com')).toBe(true);
      expect(ValidationUtils.isValidURL('example.com')).toBe(false);
      expect(ValidationUtils.isValidURL('invalid url')).toBe(false);
    });
  });

  describe('Calculation Validation', () => {
    test('should validate division operations', () => {
      expect(ValidationUtils.canDivide(10, 2)).toBe(true);
      expect(ValidationUtils.canDivide(10, 0)).toBe(false);
      expect(ValidationUtils.canDivide(0, 5)).toBe(true);
    });

    test('should validate square root operations', () => {
      expect(ValidationUtils.canSquareRoot(4)).toBe(true);
      expect(ValidationUtils.canSquareRoot(0)).toBe(true);
      expect(ValidationUtils.canSquareRoot(-1)).toBe(false);
    });

    test('should validate logarithm operations', () => {
      expect(ValidationUtils.canLogarithm(10)).toBe(true);
      expect(ValidationUtils.canLogarithm(0.1)).toBe(true);
      expect(ValidationUtils.canLogarithm(0)).toBe(false);
      expect(ValidationUtils.canLogarithm(-1)).toBe(false);
    });

    test('should validate factorial operations', () => {
      expect(ValidationUtils.canFactorial(5)).toBe(true);
      expect(ValidationUtils.canFactorial(0)).toBe(true);
      expect(ValidationUtils.canFactorial(-1)).toBe(false);
      expect(ValidationUtils.canFactorial(3.5)).toBe(false);
    });
  });

  describe('Error Messages', () => {
    test('should provide appropriate error messages', () => {
      expect(ValidationUtils.getValidationError('invalid_number')).toBe('Invalid number format');
      expect(ValidationUtils.getValidationError('division_by_zero')).toBe('Division by zero is not allowed');
      expect(ValidationUtils.getValidationError('negative_sqrt')).toBe('Cannot calculate square root of negative number');
      expect(ValidationUtils.getValidationError('invalid_expression')).toBe('Invalid mathematical expression');
    });

    test('should return default error for unknown codes', () => {
      expect(ValidationUtils.getValidationError('unknown_error')).toBe('Validation error');
    });
  });

  describe('Performance', () => {
    test('should validate expressions quickly', () => {
      const expressions = [
        '2 + 3', '10 - 5', '4 * 6', '8 / 2',
        'sin(30)', 'cos(0)', 'log(100)', 'sqrt(16)',
        '(2 + 3) * 4', 'sin(cos(0))', '2 * pi + e'
      ];

      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        expressions.forEach(expr => {
          ValidationUtils.isValidExpression(expr);
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 11000 validations should complete in under 200ms
      expect(duration).toBeLessThan(200);
    });
  });
});