import { Logger } from './types';

export class NoopLogger implements Logger {
  info(): void {}
  warn(): void {}
  debug(): void {}
}

export class ConsoleLogger implements Logger {
  info(message: string): void {
    console.info(message);
  }

  warn(message: string): void {
    console.warn(message);
  }

  debug(message: string): void {
    console.debug(message);
  }
}

export function getLogger(logger?: Logger): Logger {
  return logger ?? new NoopLogger();
}
