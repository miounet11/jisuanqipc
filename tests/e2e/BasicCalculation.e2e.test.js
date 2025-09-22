/**
 * Basic Calculator E2E Tests
 * 基础计算器端到端测试
 */

describe('Basic Calculator E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('should show welcome screen', async () => {
    await expect(element(by.text('专业科学计算器'))).toBeVisible();
  });

  it('should perform basic addition', async () => {
    // 点击数字按钮
    await element(by.text('2')).tap();
    await element(by.text('+')).tap();
    await element(by.text('3')).tap();
    await element(by.text('=')).tap();

    // 验证结果
    await expect(element(by.text('5'))).toBeVisible();
  });

  it('should perform basic subtraction', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 执行减法
    await element(by.text('8')).tap();
    await element(by.text('-')).tap();
    await element(by.text('3')).tap();
    await element(by.text('=')).tap();

    // 验证结果
    await expect(element(by.text('5'))).toBeVisible();
  });

  it('should perform basic multiplication', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 执行乘法
    await element(by.text('4')).tap();
    await element(by.text('×')).tap();
    await element(by.text('6')).tap();
    await element(by.text('=')).tap();

    // 验证结果
    await expect(element(by.text('24'))).toBeVisible();
  });

  it('should perform basic division', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 执行除法
    await element(by.text('1')).tap();
    await element(by.text('5')).tap();
    await element(by.text('÷')).tap();
    await element(by.text('3')).tap();
    await element(by.text('=')).tap();

    // 验证结果
    await expect(element(by.text('5'))).toBeVisible();
  });

  it('should handle decimal calculations', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 执行小数计算
    await element(by.text('2')).tap();
    await element(by.text('.')).tap();
    await element(by.text('5')).tap();
    await element(by.text('+')).tap();
    await element(by.text('1')).tap();
    await element(by.text('.')).tap();
    await element(by.text('5')).tap();
    await element(by.text('=')).tap();

    // 验证结果
    await expect(element(by.text('4'))).toBeVisible();
  });

  it('should handle clear function', async () => {
    // 输入一些数字
    await element(by.text('1')).tap();
    await element(by.text('2')).tap();
    await element(by.text('3')).tap();

    // 验证数字显示
    await expect(element(by.text('123'))).toBeVisible();

    // 清除
    await element(by.text('C')).tap();

    // 验证清除后显示0
    await expect(element(by.text('0'))).toBeVisible();
  });

  it('should handle memory operations', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 输入数字并存储到内存
    await element(by.text('4')).tap();
    await element(by.text('2')).tap();
    await element(by.text('M+')).tap();

    // 清除显示
    await element(by.text('C')).tap();

    // 从内存召回
    await element(by.text('MR')).tap();

    // 验证结果
    await expect(element(by.text('42'))).toBeVisible();
  });

  it('should handle percentage calculations', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 计算百分比
    await element(by.text('5')).tap();
    await element(by.text('0')).tap();
    await element(by.text('%')).tap();

    // 验证结果（50% = 0.5）
    await expect(element(by.text('0.5'))).toBeVisible();
  });

  it('should handle negative numbers', async () => {
    // 清除显示
    await element(by.text('C')).tap();

    // 输入负数
    await element(by.text('±')).tap();
    await element(by.text('5')).tap();

    // 验证负数显示
    await expect(element(by.text('-5'))).toBeVisible();
  });

  it('should switch between calculator modes', async () => {
    // 验证基础模式
    await expect(element(by.text('基础'))).toBeVisible();

    // 切换到科学模式
    await element(by.text('科学')).tap();
    await expect(element(by.text('sin'))).toBeVisible();

    // 切换到图形模式
    await element(by.text('图形')).tap();
    await expect(element(by.text('绘图'))).toBeVisible();

    // 切换回基础模式
    await element(by.text('基础')).tap();
    await expect(element(by.text('+'))).toBeVisible();
  });
});