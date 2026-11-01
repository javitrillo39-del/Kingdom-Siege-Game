import { useEffect, useRef, useState } from "react";
import {
  getOnlineCount,
  sendPresenceHeartbeat,
} from "../services/presenceApi.js";
import {
  getPresenceConnection,
  isValidOnlineCountResponse,
  recordPresenceCountFailure,
  recordPresenceCountSuccess,
  retryPresenceRequest,
} from "../services/presencePolling.js";

const PRESENCE_INTERVAL_MS = 30_000;

export default function usePresence({ userId, onUnauthorized }) {
  const [counter, setCounter] = useState({ onlineCount: null, failures: 0 });
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;

  useEffect(() => {
    let disposed = false;
    let sessionExpired = false;
    let heartbeatInFlight = false;
    let countInFlight = false;
    let countRequestId = 0;
    let heartbeatIntervalId;
    let countIntervalId;
    const controllers = new Set();

    function stopForUnauthorized() {
      if (disposed || sessionExpired) return;
      sessionExpired = true;
      window.clearInterval(heartbeatIntervalId);
      window.clearInterval(countIntervalId);
      for (const controller of controllers) controller.abort();
      controllers.clear();
      localStorage.removeItem("ks_token");
      onUnauthorizedRef.current?.();
    }

    async function runRequest(operation) {
      const controller = new AbortController();
      controllers.add(controller);
      try {
        return await retryPresenceRequest(operation, { signal: controller.signal });
      } catch (error) {
        if (error?.status === 401) stopForUnauthorized();
        throw error;
      } finally {
        controllers.delete(controller);
      }
    }

    async function sendHeartbeat() {
      if (disposed || sessionExpired || heartbeatInFlight) return false;
      heartbeatInFlight = true;
      try {
        await runRequest((signal) => sendPresenceHeartbeat({ signal }));
        return true;
      } catch {
        return false;
      } finally {
        heartbeatInFlight = false;
      }
    }

    async function refreshOnlineCount() {
      if (disposed || sessionExpired || countInFlight) return;
      countInFlight = true;
      const requestId = ++countRequestId;
      try {
        const result = await runRequest((signal) => getOnlineCount({ signal }));
        if (!isValidOnlineCountResponse(result)) {
          throw new Error("Invalid online player count response.");
        }
        if (!disposed && !sessionExpired && requestId === countRequestId) {
          setCounter(recordPresenceCountSuccess(result.onlinePlayers));
        }
      } catch (error) {
        if (error?.status === 401) return;
        if (!disposed && !sessionExpired && requestId === countRequestId) {
          setCounter(recordPresenceCountFailure);
        }
      } finally {
        countInFlight = false;
      }
    }

    async function startPresence() {
      await sendHeartbeat();
      if (disposed || sessionExpired) return;

      heartbeatIntervalId = window.setInterval(
        () => void sendHeartbeat(),
        PRESENCE_INTERVAL_MS,
      );
      await refreshOnlineCount();
      if (disposed || sessionExpired) return;

      countIntervalId = window.setInterval(
        () => void refreshOnlineCount(),
        PRESENCE_INTERVAL_MS,
      );
    }

    setCounter({ onlineCount: null, failures: 0 });
    void startPresence();

    return () => {
      disposed = true;
      window.clearInterval(heartbeatIntervalId);
      window.clearInterval(countIntervalId);
      for (const controller of controllers) controller.abort();
      controllers.clear();
    };
  }, [userId]);

  const connection = getPresenceConnection(counter);

  return {
    available: connection === "connected",
    connection,
    onlineCount: counter.onlineCount,
  };
}
