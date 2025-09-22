/**
 * Detox Test Environment
 * Detox测试环境配置
 */

const DetoxCircusEnvironment = require('detox/runners/jest-circus/environment');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);

    // Register global error handlers
    this.initWorker = async () => {
      await super.initWorker();

      // Add custom global utilities if needed
      this.global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Add custom matchers
      this.global.expectToBeVisible = async (element) => {
        await expect(element).toBeVisible();
      };

      this.global.expectToHaveText = async (element, text) => {
        await expect(element).toHaveText(text);
      };
    };
  }

  async handleTestEvent(event, state) {
    if (event.name === 'test_start') {
      console.log(`Starting test: ${event.test.name}`);
    }

    if (event.name === 'test_done') {
      if (event.test.errors.length > 0) {
        console.log(`Test failed: ${event.test.name}`);
        // Take screenshot on failure if needed
        try {
          await device.takeScreenshot(`failed-${event.test.name}`);
        } catch (error) {
          console.log('Failed to take screenshot:', error);
        }
      } else {
        console.log(`Test passed: ${event.test.name}`);
      }
    }

    await super.handleTestEvent(event, state);
  }
}

module.exports = CustomDetoxEnvironment;