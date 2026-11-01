import assert from "node:assert/strict";
import test from "node:test";
import {
  getPresenceConnection,
  isValidOnlineCountResponse,
  recordPresenceCountFailure,
  recordPresenceCountSuccess,
  retryPresenceRequest,
} from "../src/services/presencePolling.js";

test("keeps the last valid count visible during two temporary failures", () => {
  const valid = recordPresenceCountSuccess(4);
  const firstFailure = recordPresenceCountFailure(valid);
  const secondFailure = recordPresenceCountFailure(firstFailure);

  assert.equal(firstFailure.onlineCount, 4);
  assert.equal(secondFailure.onlineCount, 4);
  assert.equal(getPresenceConnection(firstFailure), "updating");
  assert.equal(getPresenceConnection(secondFailure), "updating");
  assert.equal(getPresenceConnection(recordPresenceCountFailure(secondFailure)), "unavailable");
});

test("returns to the connected state and resets failures after a successful count", () => {
  const recovering = recordPresenceCountFailure(
    recordPresenceCountFailure(recordPresenceCountSuccess(2)),
  );
  const recovered = recordPresenceCountSuccess(3);

  assert.equal(getPresenceConnection(recovering), "updating");
  assert.deepEqual(recovered, { onlineCount: 3, failures: 0 });
  assert.equal(getPresenceConnection(recovered), "connected");
});

test("accepts a legacy count during staggered API deployment and validates new timestamps", () => {
  assert.equal(isValidOnlineCountResponse({ onlinePlayers: 3 }), true);
  assert.equal(
    isValidOnlineCountResponse({
      onlinePlayers: 3,
      calculatedAt: new Date().toISOString(),
    }),
    true,
  );
  assert.equal(isValidOnlineCountResponse({ onlinePlayers: -1 }), false);
  assert.equal(isValidOnlineCountResponse({ onlinePlayers: 3, calculatedAt: "invalid" }), false);
});

test("retries transient API errors after 2, 5 and 10 seconds", async () => {
  const waits = [];
  let attempts = 0;
  const result = await retryPresenceRequest(
    async () => {
      attempts += 1;
      if (attempts < 4) throw new TypeError("Network unavailable");
      return "recovered";
    },
    { wait: async (milliseconds) => waits.push(milliseconds) },
  );

  assert.equal(result, "recovered");
  assert.deepEqual(waits, [2_000, 5_000, 10_000]);
});

test("does not retry unauthorized or permanent client errors", async () => {
  let attempts = 0;
  await assert.rejects(
    retryPresenceRequest(async () => {
      attempts += 1;
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }, { wait: async () => assert.fail("401 must not be retried") }),
    (error) => error.status === 401,
  );
  assert.equal(attempts, 1);
});
