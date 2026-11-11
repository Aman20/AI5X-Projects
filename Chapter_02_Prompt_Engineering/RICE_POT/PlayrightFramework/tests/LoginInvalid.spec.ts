import { test } from '../fixtures/base.fixture';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../utils/ConfigManager';

test.describe('Wingify login - invalid flows', { tag: '@negative' }, () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page, logger }) => {
    try {
      loginPage = new LoginPage(page);
      await loginPage.open();
    } catch (error) {
      logger.error('Login page setup failed', error);
      throw error;
    }
  });

  test.afterEach(async ({ page, logger }, testInfo) => {
    try {
      logger.info(`Finished with status ${testInfo.status}`);
      await page.context().clearCookies();
    } catch (error) {
      logger.error('Teardown failed', error);
      throw error;
    }
  });

  for (const scenario of loginData.invalidLogins) {
    test(`rejects login with ${scenario.title}`, async ({ logger }) => {
      try {
        const response = await loginPage.login(scenario.email, scenario.password);
        await loginPage.expectLoginRejected(response);
      } catch (error) {
        logger.error('Invalid login verification failed', error);
        throw error;
      }
    });
  }
});
