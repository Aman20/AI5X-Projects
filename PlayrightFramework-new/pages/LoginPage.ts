import { expect, Locator, Page, Response } from '@playwright/test';
import { loginData } from '../utils/ConfigManager';
import { Logger } from '../utils/Logger';

export class LoginPage {
  readonly page: Page;
  readonly logo: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly passwordToggle: Locator;
  readonly forgotPasswordButton: Locator;
  readonly rememberMeLabel: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly signInButton: Locator;
  readonly googleSignInButton: Locator;
  readonly ssoSignInButton: Locator;
  readonly passkeySignInButton: Locator;
  readonly freeTrialLink: Locator;
  readonly privacyPolicyLink: Locator;
  readonly termsLink: Locator;
  readonly resetPasswordButton: Locator;
  readonly backButton: Locator;
  private readonly logger = new Logger('LoginPage');

  constructor(page: Page) {
    this.page = page;
    this.logo = page.getByRole('img', { name: 'Wingify', exact: true });
    this.email = page.getByRole('textbox', { name: 'Email address', exact: true });
    this.password = page.getByRole('textbox', { name: 'Password', exact: true });
    this.passwordToggle = page.getByRole('button', { name: 'Toggle password visibility' });
    this.forgotPasswordButton = page.getByRole('button', { name: 'Forgot Password?' });
    this.rememberMeLabel = page.getByText('Remember me', { exact: true });
    this.rememberMeCheckbox = page.getByLabel('Remember me');
    this.signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
    this.googleSignInButton = page.getByRole('button', { name: 'Sign in with Google' });
    this.ssoSignInButton = page.getByRole('button', { name: 'Sign in using SSO' });
    this.passkeySignInButton = page.getByRole('button', { name: 'Sign in with Passkey' });
    this.freeTrialLink = page.getByRole('link', { name: 'Start a FREE TRIAL' });
    this.privacyPolicyLink = page.getByRole('link', { name: 'Privacy policy' });
    this.termsLink = page.getByRole('link', { name: 'Terms' });
    this.resetPasswordButton = page.getByRole('button', { name: 'Reset Password' });
    this.backButton = page.getByRole('button', { name: 'Back' });
  }

  async open(): Promise<void> {
    await this.perform('open login page', async () => {
      await this.page.goto(loginData.routes.login);
      await expect(this.signInButton).toBeVisible();
    });
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.perform('fill credentials', async () => {
      await this.email.fill(email);
      await this.password.fill(password);
    });
  }

  async submit(): Promise<Response> {
    return this.perform('submit login form', async () => {
      const [response] = await Promise.all([
        this.page.waitForResponse(
          (candidate) =>
            candidate.request().method() === 'POST' &&
            new URL(candidate.url()).pathname === loginData.api.loginPath,
        ),
        this.signInButton.click(),
      ]);
      return response;
    });
  }

  async login(email: string, password: string): Promise<Response> {
    await this.fillCredentials(email, password);
    return this.submit();
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.perform('toggle password visibility', () => this.passwordToggle.click());
  }

  async toggleRememberMe(): Promise<void> {
    await this.perform('toggle remember me', () => this.rememberMeLabel.click());
  }

  async openForgotPassword(): Promise<void> {
    await this.perform('open forgot password', () => this.forgotPasswordButton.click());
  }

  async returnFromForgotPassword(): Promise<void> {
    await this.perform('return from forgot password', () => this.backButton.click());
  }

  async expectControlsVisible(): Promise<void> {
    await this.perform('verify login controls', async () => {
      await expect(this.page).toHaveTitle(loginData.ui.pageTitle);
      const controls = [
        this.logo,
        this.email,
        this.password,
        this.passwordToggle,
        this.forgotPasswordButton,
        this.rememberMeLabel,
        this.signInButton,
        this.googleSignInButton,
        this.ssoSignInButton,
        this.passkeySignInButton,
        this.freeTrialLink,
        this.privacyPolicyLink,
        this.termsLink,
      ];
      for (const control of controls) {
        await expect(control).toBeVisible();
      }
    });
  }

  async expectPlaceholders(): Promise<void> {
    await this.perform('verify field placeholders', async () => {
      await expect(this.email).toHaveAttribute('placeholder', loginData.ui.emailPlaceholder);
      await expect(this.password).toHaveAttribute('placeholder', loginData.ui.passwordPlaceholder);
    });
  }

  async expectPasswordType(type: string): Promise<void> {
    await this.perform(`verify password field type ${type}`, () =>
      expect(this.password).toHaveAttribute('type', type),
    );
  }

  async expectRememberMeChecked(checked: boolean): Promise<void> {
    await this.perform(`verify remember me checked=${checked}`, () =>
      expect(this.rememberMeCheckbox).toBeChecked({ checked }),
    );
  }

  async expectForgotPasswordShown(): Promise<void> {
    await this.perform('verify forgot password view', async () => {
      await expect(this.page).toHaveURL(loginData.routes.forgotPassword);
      await expect(this.resetPasswordButton).toBeVisible();
      await expect(this.email).toHaveCount(1);
      await expect(this.email).toBeVisible();
    });
  }

  async expectOnLoginRoute(): Promise<void> {
    await this.perform('verify login route', async () => {
      await expect(this.page).toHaveURL(loginData.routes.login);
      await expect(this.signInButton).toBeVisible();
    });
  }

  async expectLoginRejected(response: Response): Promise<void> {
    await this.perform('verify login rejected', async () => {
      expect(response.status()).toBe(loginData.api.rejectedStatus);
      await expect(this.page.getByText(loginData.errors.invalidLogin)).toBeVisible();
      await this.expectOnLoginRoute();
    });
  }

  async expectAuthenticated(response: Response): Promise<void> {
    await this.perform('verify authenticated', async () => {
      expect(response.ok()).toBe(true);
      await expect(this.page).not.toHaveURL(loginData.routes.login);
      await expect(this.signInButton).toBeHidden();
    });
  }

  private async perform<T>(action: string, step: () => Promise<T>): Promise<T> {
    this.logger.info(action);
    try {
      return await step();
    } catch (error) {
      this.logger.error(`${action} failed`, error);
      throw new Error(`LoginPage: ${action} failed: ${Logger.describe(error)}`, { cause: error });
    }
  }
}
