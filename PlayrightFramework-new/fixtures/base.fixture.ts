import { test as base, expect } from '@playwright/test';
import { config, LoginData, loginData } from '../utils/ConfigManager';
import { Logger } from '../utils/Logger';

interface Credentials {
  email: string;
  password: string;
}

interface FrameworkFixtures {
  logger: Logger;
  testData: LoginData;
  credentials: Credentials;
}

export const test = base.extend<FrameworkFixtures>({
  logger: async ({}, use, testInfo) => {
    await use(new Logger(testInfo.title));
  },
  testData: async ({}, use) => {
    await use(loginData);
  },
  credentials: async ({}, use) => {
    await use({ email: config.userEmail, password: config.userPassword });
  },
});

export { expect };
