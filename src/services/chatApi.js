import { call } from "./api.js";
import { socialApi } from "./socialApi.js";

export const chatApi = {
  getChannels({ signal } = {}) {
    return call("/chat/channels", { signal });
  },
  getMessages(channelId, page = 1, { signal } = {}) {
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    return call(`/chat/channels/${encodeURIComponent(channelId)}/messages?${params}`, { signal });
  },
  sendMessage(channelId, messageText) {
    return call(`/chat/channels/${encodeURIComponent(channelId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ messageText }),
    });
  },
  openPrivate(publicPlayerId) {
    return call(`/chat/private/${encodeURIComponent(publicPlayerId)}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  reportMessage(messageId, reason = "other", details = "") {
    return call(`/chat/messages/${encodeURIComponent(messageId)}/report`, {
      method: "POST",
      body: JSON.stringify({ reason, details }),
    });
  },
  mutePlayer(publicPlayerId) {
    return call(`/chat/mute/${encodeURIComponent(publicPlayerId)}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  unmutePlayer(publicPlayerId) {
    return call(`/chat/mute/${encodeURIComponent(publicPlayerId)}`, {
      method: "DELETE",
    });
  },
  blockPlayer(publicPlayerId) {
    return socialApi.blockPlayer(publicPlayerId);
  },
};
