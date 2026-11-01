import { call } from "./api.js";

export function sendPresenceHeartbeat() {
  return call("/presence/heartbeat", {
    method: "POST",
  });
}

export function getOnlineCount() {
  return call("/presence/online-count");
}

export function logoutPresence() {
  return call("/presence/logout", { method: "POST" });
}
