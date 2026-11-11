import { test } from '../fixtures/base.fixture';
import { LoginPage } from '../pages/LoginPage';
import { config } from '../utils/ConfigManager';

test.describe('Wingify login - valid flows', () => {
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

  test.describe('UI validation', { tag: '@ui' }, () => {
    test('displays all login controls', async ({ logger }) => {
      try {
        await loginPage.expectControlsVisible();
      } catch (error) {
        logger.error('Login controls verification failed', error);
        throw error;
      }
    });

    test('displays field placeholders', async ({ logger }) => {
      try {
        await loginPage.expectPlaceholders();
      } catch (error) {
        logger.error('Placeholder verification failed', error);
        throw error;
      }
    });

    test('masks and reveals the password', async ({ logger, testData }) => {
      try {
        await loginPage.password.fill(testData.ui.samplePassword);
        await loginPage.expectPasswordType(testData.ui.maskedPasswordType);
        await loginPage.togglePasswordVisibility();
        await loginPage.expectPasswordType(testData.ui.revealedPasswordType);
        await loginPage.togglePasswordVisibility();
        await loginPage.expectPasswordType(testData.ui.maskedPasswordType);
      } catch (error) {
        logger.error('Password visibility verification failed', error);
        throw error;
      }
    });

    test('toggles remember me', async ({ logger }) => {
      try {
        await loginPage.expectRememberMeChecked(false);
        await loginPage.toggleRememberMe();
        await loginPage.expectRememberMeChecked(true);
        await loginPage.toggleRememberMe();
        await loginPage.expectRememberMeChecked(false);
      } catch (error) {
        logger.error('Remember me verification failed', error);
        throw error;
      }
    });

    test('navigates to forgot password and back', async ({ logger }) => {
      try {
        await loginPage.openForgotPassword();
        await loginPage.expectForgotPasswordShown();
        await loginPage.returnFromForgotPassword();
        await loginPage.expectOnLoginRoute();
      } catch (error) {
        logger.error('Forgot password navigation failed', error);
        throw error;
      }
    });
  });

  test.describe('Authentication', { tag: '@auth' }, () => {
    test.skip(
      !config.hasCredentials,
      'Insufficient information to determine. USER_EMAIL and USER_PASSWORD are empty in testdata/qa.env.',
    );

    test.beforeEach(() => {
      test.info().annotations.push({
        type: 'Inference (low confidence)',
        description: 'Post-login success is inferred from a 2xx login response and leaving the login route.',
      });
    });

    test('signs in with valid credentials', async ({ credentials, logger }) => {
      try {
        const response = await loginPage.login(credentials.email, credentials.password);
        await loginPage.expectAuthenticated(response);
      } catch (error) {
        logger.error('Valid login failed', error);
        throw error;
      }
    });

    test('signs in with valid credentials and remember me', async ({ credentials, logger }) => {
      try {
        await loginPage.toggleRememberMe();
        await loginPage.expectRememberMeChecked(true);
        const response = await loginPage.login(credentials.email, credentials.password);
        await loginPage.expectAuthenticated(response);
      } catch (error) {
        logger.error('Valid login with remember me failed', error);
        throw error;
      }
    });
  });
});
