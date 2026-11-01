import { useEffect, useState } from "react";
import {
  getOnlineCount,
  sendPresenceHeartbeat,
} from "../services/presenceApi.js";

const PRESENCE_INTERVAL_MS = 30_000;

export default function usePresence({ userId }) {
  const [connection, setConnection] = useState("connecting");
  const [onlineCount, setOnlineCount] = useState(null);

  useEffect(() => {
    let disposed = false;
    let refreshing = false;

    async function refreshPresence() {
      if (refreshing) return;
      refreshing = true;

      try {
        await sendPresenceHeartbeat();
      } catch {
        if (!disposed) console.warn("Presence heartbeat request failed.");
      }

      try {
        const result = await getOnlineCount();
        if (!Number.isSafeInteger(result.onlinePlayers) || result.onlinePlayers < 0) {
          throw new Error("Invalid online player count.");
        }
        if (!disposed) {
          setOnlineCount(result.onlinePlayers);
          setConnection("connected");
        }
      } catch {
        if (!disposed) setConnection("unavailable");
      } finally {
        refreshing = false;
      }
    }

    setConnection("connecting");
    setOnlineCount(null);
    void refreshPresence();

    const intervalId = window.setInterval(
      () => void refreshPresence(),
      PRESENCE_INTERVAL_MS,
    );

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
    };
  }, [userId]);

  return {
    available: connection === "connected",
    connection,
    onlineCount,
  };
}
