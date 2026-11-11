import { chromium } from '@playwright/test';
import * as fs from 'fs';
import { LoginPage } from './pages/LoginPage';
import { config } from './utils/ConfigManager';
import { Logger } from './utils/Logger';

export default async function globalSetup(): Promise<void> {
  const logger = new Logger('GlobalSetup');

  if (!config.hasCredentials) {
    logger.warn('USER_EMAIL or USER_PASSWORD is empty; writing an unauthenticated auth.json');
    fs.writeFileSync(config.authFile, JSON.stringify({ cookies: [], origins: [] }, null, 2));
    return;
  }

  const browser = await chromium.launch({ channel: config.browserChannel });
  try {
    const context = await browser.newContext({ baseURL: config.baseUrl });
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.open();
    const response = await loginPage.login(config.userEmail, config.userPassword);
    await loginPage.expectAuthenticated(response);
    await context.storageState({ path: config.authFile });
    logger.info('Authenticated session saved to auth.json');
  } catch (error) {
    logger.error('Authentication setup failed', error);
    throw new Error(`Global setup failed: ${Logger.describe(error)}`, { cause: error });
  } finally {
    await browser.close();
  }
}
