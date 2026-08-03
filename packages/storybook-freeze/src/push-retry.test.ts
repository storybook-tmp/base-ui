import { describe, expect, it, vi } from 'vitest';
import { isTransientPushError, pushWithRetry, retryDelayMs } from './push-retry';

const GITHUB_503 =
  'error: RPC failed; HTTP 503 curl 22 The requested URL returned error: 503\n' +
  'send-pack: unexpected disconnect while reading sideband packet\n' +
  'fatal: the remote end hung up unexpectedly';

const noSleep = (): Promise<void> => Promise.resolve();

describe('isTransientPushError', () => {
  it('treats server hiccups and dropped connections as transient', () => {
    expect(isTransientPushError(GITHUB_503)).toBe(true);
    expect(isTransientPushError('fatal: the remote end hung up unexpectedly')).toBe(true);
    expect(isTransientPushError('error: RPC failed; curl 56 Recv failure: Connection reset')).toBe(
      true,
    );
    expect(isTransientPushError('fatal: unable to access "https://github.com/x": 502')).toBe(true);
  });

  it('does not retry failures that a retry cannot fix', () => {
    expect(isTransientPushError('remote: Permission to org/repo.git denied to user')).toBe(false);
    expect(isTransientPushError('error: failed to push some refs (non-fast-forward)')).toBe(false);
    expect(isTransientPushError("fatal: 'origin' does not appear to be a git repository")).toBe(
      false,
    );
  });
});

describe('retryDelayMs', () => {
  it('backs off exponentially and caps', () => {
    expect(retryDelayMs(1)).toBe(3000);
    expect(retryDelayMs(2)).toBe(9000);
    expect(retryDelayMs(3)).toBe(27_000);
    expect(retryDelayMs(10)).toBe(60_000);
  });
});

describe('pushWithRetry', () => {
  it('returns after a single successful push', async () => {
    const push = vi.fn(async () => {});
    const outcome = await pushWithRetry({ attempts: 4, push, sleep: noSleep });
    expect(outcome).toEqual({ attempts: 1, landedDespiteError: false });
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('retries a transient failure and reports the attempt count', async () => {
    const push = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error(GITHUB_503))
      .mockRejectedValueOnce(new Error(GITHUB_503))
      .mockResolvedValueOnce(undefined);
    const onRetry = vi.fn();

    const outcome = await pushWithRetry({ attempts: 4, push, onRetry, sleep: noSleep });

    expect(outcome.attempts).toBe(3);
    expect(outcome.landedDespiteError).toBe(false);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry.mock.calls[0][0]).toMatchObject({ attempt: 1, attempts: 4, delayMs: 3000 });
    expect(onRetry.mock.calls[1][0]).toMatchObject({ attempt: 2, delayMs: 9000 });
  });

  it('succeeds when the ref landed despite the broken connection', async () => {
    const push = vi.fn<() => Promise<void>>().mockRejectedValue(new Error(GITHUB_503));
    const verify = vi.fn(async () => true);

    const outcome = await pushWithRetry({ attempts: 4, push, verify, sleep: noSleep });

    expect(outcome).toEqual({ attempts: 1, landedDespiteError: true });
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('gives up after the configured attempts and rethrows the last error', async () => {
    const push = vi.fn<() => Promise<void>>().mockRejectedValue(new Error(GITHUB_503));
    const verify = vi.fn(async () => false);

    await expect(pushWithRetry({ attempts: 3, push, verify, sleep: noSleep })).rejects.toThrow(
      /HTTP 503/,
    );
    expect(push).toHaveBeenCalledTimes(3);
  });

  it('keeps reporting the push error when the verify itself fails', async () => {
    const push = vi.fn<() => Promise<void>>().mockRejectedValue(new Error(GITHUB_503));
    const verify = vi.fn<() => Promise<boolean>>().mockRejectedValue(new Error('ls-remote failed'));

    await expect(pushWithRetry({ attempts: 2, push, verify, sleep: noSleep })).rejects.toThrow(
      /HTTP 503/,
    );
    expect(push).toHaveBeenCalledTimes(2);
  });

  it('does not retry a non-transient failure', async () => {
    const push = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(new Error('remote: Permission to org/repo.git denied'));

    await expect(pushWithRetry({ attempts: 4, push, sleep: noSleep })).rejects.toThrow(
      /Permission/,
    );
    expect(push).toHaveBeenCalledTimes(1);
  });

  it('waits between attempts', async () => {
    const sleep = vi.fn(async () => {});
    const push = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error(GITHUB_503))
      .mockResolvedValueOnce(undefined);

    await pushWithRetry({ attempts: 2, push, sleep });

    expect(sleep).toHaveBeenCalledWith(3000);
  });
});
