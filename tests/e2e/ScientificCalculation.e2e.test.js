/**
 * Scientific Calculator E2E Tests
 * 科学计算器端到端测试
 */

describe('Scientific Calculator E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // 切换到科学计算器模式
    await element(by.text('科学')).tap();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('should show scientific calculator interface', async () => {
    // 验证科学计算器特有的按钮
    await expect(element(by.text('sin'))).toBeVisible();
    await expect(element(by.text('cos'))).toBeVisible();
    await expect(element(by.text('tan'))).toBeVisible();
    await expect(element(by.text('log'))).toBeVisible();
    await expect(element(by.text('ln'))).toBeVisible();
  });

  it('should calculate sine function', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 计算 sin(30°) = 0.5
    await element(by.text('3')).tap();
    await element(by.text('0')).tap();
    await element(by.text('sin')).tap();

    // 验证结果（近似0.5）
    await expect(element(by.text(/0\.5/))).toBeVisible();
  });

  it('should calculate cosine function', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 计算 cos(60°) = 0.5
    await element(by.text('6')).tap();
    await element(by.text('0')).tap();
    await element(by.text('cos')).tap();

    // 验证结果（近似0.5）
    await expect(element(by.text(/0\.5/))).toBeVisible();
  });

  it('should calculate tangent function', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 计算 tan(45°) = 1
    await element(by.text('4')).tap();
    await element(by.text('5')).tap();
    await element(by.text('tan')).tap();

    // 验证结果（近似1）
    await expect(element(by.text(/1\.0*/))).toBeVisible();
  });

  it('should calculate logarithms', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 计算 log(100) = 2
    await element(by.text('1')).tap();
    await element(by.text('0')).tap();
    await element(by.text('0')).tap();
    await element(by.text('log')).tap();

    // 验证结果
    await expect(element(by.text('2'))).toBeVisible();
  });

  it('should calculate natural logarithms', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 计算 ln(e) = 1
    await element(by.text('e')).tap();
    await element(by.text('ln')).tap();

    // 验证结果
    await expect(element(by.text('1'))).toBeVisible();
  });

  it('should calculate powers', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 计算 2^3 = 8
    await element(by.text('2')).tap();
    await element(by.text('x^y')).tap();
    await element(by.text('3')).tap();
    await element(by.text('=')).tap();

    // 验证结果
    await expect(element(by.text('8'))).toBeVisible();
  });

  it('should calculate square root', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 计算 √16 = 4
    await element(by.text('1')).tap();
    await element(by.text('6')).tap();
    await element(by.text('√'))).tap();

    // 验证结果
    await expect(element(by.text('4'))).toBeVisible();
  });

  it('should calculate factorial', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 计算 5! = 120
    await element(by.text('5')).tap();
    await element(by.text('!')).tap();

    // 验证结果
    await expect(element(by.text('120'))).toBeVisible();
  });

  it('should switch angle units', async () => {
    // 验证角度单位切换按钮存在
    await expect(element(by.text('DEG'))).toBeVisible();

    // 切换到弧度模式
    await element(by.text('DEG')).tap();
    await expect(element(by.text('RAD'))).toBeVisible();

    // 切换回度数模式
    await element(by.text('RAD')).tap();
    await expect(element(by.text('DEG'))).toBeVisible();
  });

  it('should handle shift mode functions', async () => {
    // 点击shift按钮
    await element(by.text('Shift')).tap();

    // 验证反三角函数可见
    await expect(element(by.text('asin'))).toBeVisible();
    await expect(element(by.text('acos'))).toBeVisible();
    await expect(element(by.text('atan'))).toBeVisible();

    // 再次点击shift返回正常模式
    await element(by.text('Shift')).tap();
    await expect(element(by.text('sin'))).toBeVisible();
  });

  it('should calculate inverse trigonometric functions', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 启用shift模式
    await element(by.text('Shift')).tap();

    // 计算 arcsin(0.5) = 30°
    await element(by.text('0')).tap();
    await element(by.text('.')).tap();
    await element(by.text('5')).tap();
    await element(by.text('asin')).tap();

    // 验证结果（近似30）
    await expect(element(by.text(/30/))).toBeVisible();
  });

  it('should calculate exponential function', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 计算 e^1 = e
    await element(by.text('1')).tap();
    await element(by.text('e^x')).tap();

    // 验证结果（近似2.718）
    await expect(element(by.text(/2\.71/))).toBeVisible();
  });

  it('should handle pi constant', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 输入π
    await element(by.text('π')).tap();

    // 验证π值显示
    await expect(element(by.text(/3\.14/))).toBeVisible();
  });

  it('should handle complex calculations', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 计算复杂表达式: sin(30°) + cos(60°)
    await element(by.text('3')).tap();
    await element(by.text('0')).tap();
    await element(by.text('sin')).tap();
    await element(by.text('+')).tap();
    await element(by.text('6')).tap();
    await element(by.text('0')).tap();
    await element(by.text('cos')).tap();
    await element(by.text('=')).tap();

    // 验证结果（0.5 + 0.5 = 1）
    await expect(element(by.text('1'))).toBeVisible();
  });
});