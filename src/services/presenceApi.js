import { call } from "./api.js";

export function startPresenceSession(activeSection) {
  return call("/presence/session", {
    method: "POST",
    body: JSON.stringify({ activeSection }),
  });
}

export function updatePresenceSection(activeSection) {
  return call("/presence/session", {
    method: "PATCH",
    body: JSON.stringify({ activeSection }),
  });
}

export function endPresenceSession() {
  return call("/presence/session", { method: "DELETE" });
}
