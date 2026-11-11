import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

export interface InvalidLogin {
  title: string;
  email: string;
  password: string;
}

export interface LoginData {
  routes: { login: string; forgotPassword: string };
  api: { loginPath: string; rejectedStatus: number };
  ui: {
    pageTitle: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    maskedPasswordType: string;
    revealedPasswordType: string;
    samplePassword: string;
  };
  errors: { invalidLogin: string };
  invalidLogins: InvalidLogin[];
}

const testDataDir = path.resolve(__dirname, '..', 'testdata');
const environment = process.env.TEST_ENV ?? 'qa';
const envFile = path.join(testDataDir, `${environment}.env`);

if (!fs.existsSync(envFile)) {
  throw new Error(`Environment file not found: ${envFile}`);
}

dotenv.config({ path: envFile, quiet: true });

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required variable ${name} in ${envFile}`);
  }
  return value;
}

function readJson<T>(fileName: string): T {
  const filePath = path.join(testDataDir, fileName);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read test data ${filePath}: ${reason}`, { cause: error });
  }
}

const userEmail = process.env.USER_EMAIL?.trim() ?? '';
const userPassword = process.env.USER_PASSWORD?.trim() ?? '';

export const config = {
  environment,
  baseUrl: requireEnv('BASE_URL'),
  browserChannel: process.env.BROWSER_CHANNEL?.trim() || undefined,
  userEmail,
  userPassword,
  hasCredentials: userEmail.length > 0 && userPassword.length > 0,
  authFile: path.resolve(__dirname, '..', 'auth.json'),
} as const;

export const loginData = readJson<LoginData>('loginData.json');
