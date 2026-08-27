import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Loads environment-specific config (qa/staging/prod) based on TEST_ENV.
 * Precedence: real process.env vars (e.g. CI secrets) > values from config/<env>.env
 * This lets CI inject secrets without ever committing them, while local devs
 * can just drop a config/qa.env file and go.
 */
class ConfigManager {
  private static instance: ConfigManager;
  public readonly env: string;
  public readonly baseUrl: string;
  public readonly adminUsername: string;
  public readonly adminPassword: string;
  public readonly defaultTimeout: number;

  private constructor() {
    this.env = process.env.TEST_ENV || 'qa';
    const envFile = path.resolve(__dirname, `../../config/${this.env}.env`);

    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile });
    }

    this.baseUrl = process.env.BASE_URL || 'https://opensource-demo.orangehrmlive.com';
    this.adminUsername = process.env.ADMIN_USERNAME || 'Admin';
    this.adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    this.defaultTimeout = Number(process.env.DEFAULT_TIMEOUT) || 15000;
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
}

export const config = ConfigManager.getInstance();
