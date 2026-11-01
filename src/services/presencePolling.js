const RETRY_DELAYS_MS = [2_000, 5_000, 10_000];
const MAX_CONSECUTIVE_COUNT_FAILURES = 3;

export function recordPresenceCountSuccess(onlineCount) {
  return { onlineCount, failures: 0 };
}

export function recordPresenceCountFailure(current) {
  return { ...current, failures: current.failures + 1 };
}

export function getPresenceConnection(counter) {
  if (counter.onlineCount === null) {
    return counter.failures >= MAX_CONSECUTIVE_COUNT_FAILURES
      ? "unavailable"
      : "connecting";
  }
  if (counter.failures >= MAX_CONSECUTIVE_COUNT_FAILURES) return "unavailable";
  return counter.failures > 0 ? "updating" : "connected";
}

export function isValidOnlineCountResponse(result) {
  if (!Number.isSafeInteger(result?.onlinePlayers) || result.onlinePlayers < 0) {
    return false;
  }
  return result.calculatedAt === undefined ||
    Number.isFinite(Date.parse(result.calculatedAt));
}

export async function retryPresenceRequest(
  operation,
  { signal, wait = waitForRetry } = {},
) {
  for (let attempt = 0; ; attempt += 1) {
    if (signal?.aborted) throw createAbortError();

    try {
      return await operation(signal);
    } catch (error) {
      if (signal?.aborted || error?.name === "AbortError") throw error;
      if (error?.status === 401) throw error;

      const retryable = !error?.status || error.status >= 500;
      const delay = RETRY_DELAYS_MS[attempt];
      if (!retryable || delay === undefined) throw error;
      await wait(delay, signal);
    }
  }
}

function waitForRetry(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timerId = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    const onAbort = () => {
      window.clearTimeout(timerId);
      reject(createAbortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function createAbortError() {
  return new DOMException("The request was aborted.", "AbortError");
}
