/**
 * Retrying pushes that fail for transient reasons.
 *
 * Publishing force-pushes ~16 branches back to back, which is exactly the traffic shape that
 * makes GitHub answer `git-receive-pack` with a 5xx or drop the connection mid-sideband. Those
 * failures say nothing about the branch, so they are retried; anything else (auth, rejected ref,
 * bad remote) is a real problem and surfaces immediately.
 */

/** Markers of a network/server hiccup rather than a problem with the ref being pushed. */
const TRANSIENT_PATTERNS = [
  /RPC failed/i,
  /HTTP\s+5\d\d/i,
  /error:\s*5\d\d/i,
  /\b(?:502|503|504)\b/,
  /unexpected disconnect/i,
  /the remote end hung up/i,
  /early EOF/i,
  /connection (?:reset|timed out|closed)/i,
  /(?:recv|send) failure/i,
  /operation timed out/i,
  /timed out/i,
  /Could not resolve host/i,
  /unable to access/i,
  /gnutls_handshake|SSL_ERROR|TLS packet/i,
  /internal server error/i,
  /service unavailable/i,
  /bad gateway/i,
  /remote error: (?:Internal|Service)/i,
];

export function isTransientPushError(message: string): boolean {
  return TRANSIENT_PATTERNS.some((pattern) => pattern.test(message));
}

/** Exponential backoff for 1-indexed attempt numbers: 3s, 9s, 27s, capped at 60s. */
export function retryDelayMs(attempt: number): number {
  return Math.min(3000 * 3 ** (attempt - 1), 60_000);
}

export interface RetryInfo {
  /** The attempt that just failed, 1-indexed. */
  attempt: number;
  attempts: number;
  delayMs: number;
  message: string;
}

export interface PushWithRetryOptions {
  /** Total number of attempts, including the first. */
  attempts: number;
  push: () => Promise<void>;
  /**
   * Whether the ref landed anyway. A push can succeed server-side and still report a broken
   * connection, so this is consulted after every transient failure before retrying.
   */
  verify?: (() => Promise<boolean>) | undefined;
  onRetry?: ((info: RetryInfo) => void) | undefined;
  /** Injected so tests do not actually wait. */
  sleep?: ((ms: number) => Promise<void>) | undefined;
}

export interface PushOutcome {
  /** How many attempts ran, including the successful one. */
  attempts: number;
  /** True when the push failed but the remote turned out to already have the ref. */
  landedDespiteError: boolean;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Run `push`, retrying transient failures with backoff. Rethrows the last error once the
 * attempts are exhausted or the failure is not transient.
 */
export async function pushWithRetry(options: PushWithRetryOptions): Promise<PushOutcome> {
  const { attempts, push, verify, onRetry, sleep = defaultSleep } = options;

  /* eslint-disable no-await-in-loop */
  for (let attempt = 1; ; attempt += 1) {
    try {
      await push();
      return { attempts: attempt, landedDespiteError: false };
    } catch (error) {
      const message = (error as Error).message ?? String(error);

      // The connection can break after the remote has already accepted the ref. A verify that
      // fails is no answer either way, so it must not mask the push error.
      if (verify && (await verify().catch(() => false))) {
        return { attempts: attempt, landedDespiteError: true };
      }

      if (attempt >= attempts || !isTransientPushError(message)) {
        throw error;
      }

      const delayMs = retryDelayMs(attempt);
      onRetry?.({ attempt, attempts, delayMs, message });
      await sleep(delayMs);
    }
  }
  /* eslint-enable no-await-in-loop */
}
