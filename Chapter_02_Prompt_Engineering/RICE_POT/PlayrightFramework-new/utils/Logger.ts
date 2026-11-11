type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export class Logger {
  private readonly scope: string;

  constructor(scope: string) {
    this.scope = scope;
  }

  info(message: string): void {
    this.write('INFO', message);
  }

  warn(message: string): void {
    this.write('WARN', message);
  }

  error(message: string, error?: unknown): void {
    this.write('ERROR', error === undefined ? message : `${message}: ${Logger.describe(error)}`);
  }

  static describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private write(level: LogLevel, message: string): void {
    const line = `${new Date().toISOString()} [${level}] [${this.scope}] ${message}`;
    if (level === 'ERROR') {
      console.error(line);
    } else {
      console.log(line);
    }
  }
}
