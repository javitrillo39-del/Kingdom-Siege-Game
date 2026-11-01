import { call } from "./api.js";

export function sendPresenceHeartbeat({ signal } = {}) {
  return call("/presence/heartbeat", {
    method: "POST",
    signal,
  });
}

export function getOnlineCount({ signal } = {}) {
  return call("/presence/online-count", { signal });
}

export function logoutPresence() {
  return call("/presence/logout", { method: "POST" });
}
