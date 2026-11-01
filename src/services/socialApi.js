import { call } from "./api.js";

const pageSize = 20;

function pageQuery(page = 1) {
  return `page=${page}&limit=${pageSize}`;
}

export const socialApi = {
  searchPlayers(query, page = 1) {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      limit: String(pageSize),
    });
    return call(`/players/search?${params}`);
  },
  getPlayer(id) {
    return call(`/players/${encodeURIComponent(id)}`);
  },
  getFriends(page = 1) {
    return call(`/friends?${pageQuery(page)}`);
  },
  getRequests(page = 1) {
    return call(`/friends/requests?${pageQuery(page)}`);
  },
  getNotifications(page = 1) {
    return call(`/notifications?${pageQuery(page)}`);
  },
  getBlockedPlayers(page = 1) {
    return call(`/blocks?${pageQuery(page)}`);
  },
  sendFriendRequest(playerId) {
    return call("/friends/requests", {
      method: "POST",
      body: JSON.stringify({ playerId }),
    });
  },
  acceptFriendRequest(requestId) {
    return call(`/friends/requests/${encodeURIComponent(requestId)}/accept`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  rejectFriendRequest(requestId) {
    return call(`/friends/requests/${encodeURIComponent(requestId)}/reject`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  removeFriend(playerId) {
    return call(`/friends/${encodeURIComponent(playerId)}`, {
      method: "DELETE",
    });
  },
  blockPlayer(playerId) {
    return call(`/blocks/${encodeURIComponent(playerId)}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  unblockPlayer(playerId) {
    return call(`/blocks/${encodeURIComponent(playerId)}`, {
      method: "DELETE",
    });
  },
};

export function getSocialPageInfo(page, items) {
  return {
    hasPrevious: page > 1,
    hasNext: items.length === pageSize,
  };
}
