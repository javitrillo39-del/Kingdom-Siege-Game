const errorKeys = {
  AUTHENTICATION_REQUIRED: "errors.unauthorized",
  INVALID_OR_EXPIRED_TOKEN: "errors.unauthorized",
  INVALID_CREDENTIALS: "login.invalidCredentials",
  USERNAME_INVALID: "login.usernameInvalid",
  PASSWORD_TOO_SHORT: "login.passwordTooShort",
  USERNAME_EXISTS: "login.usernameExists",
  INTERNAL_SERVER_ERROR: "errors.generic",
  REQUEST_FAILED: "errors.generic",
  RATE_LIMITED: "errors.chatRateLimited",
  NOT_ENOUGH_GOLD: "errors.notEnoughGold",
  NOT_ENOUGH_RESOURCES: "errors.notEnoughResources",
  NOT_ENOUGH_FOOD_OR_GOLD: "errors.notEnoughResources",
  NOT_ENOUGH_WOOD: "errors.notEnoughResources",
  PLAYER_PROFILE_NOT_FOUND: "errors.playerNotFound",
  PLAYER_NOT_FOUND: "errors.playerNotFound",
  FRIEND_REQUEST_EXISTS: "errors.friendRequestExists",
  FRIEND_REQUEST_LIMIT_REACHED: "errors.friendRequestLimit",
  PLAYER_BLOCKED: "errors.playerBlocked",
  ALREADY_FRIENDS: "errors.alreadyFriends",
  CANNOT_ADD_SELF: "errors.cannotAddSelf",
  FRIENDSHIP_REQUIRED: "chat.rejected",
  CHAT_RATE_LIMITED: "errors.chatRateLimited",
  CHAT_REPEATED_MESSAGE_LIMITED: "errors.chatRateLimited",
  CHAT_CHANNEL_NOT_FOUND: "chat.unknownError",
  MESSAGE_PLAIN_TEXT_REQUIRED: "chat.rejected",
  MESSAGE_EMPTY: "chat.rejected",
  MESSAGE_TOO_LONG: "chat.rejected",
  MESSAGE_UNSUPPORTED_CHARACTERS: "chat.rejected",
  MESSAGE_LINKS_NOT_ALLOWED: "chat.rejected",
  USER_BLOCKED: "chat.userBlocked",
};

export function apiErrorKey(error, fallback = "errors.generic") {
  const code = String(error?.code || error?.message || "").trim().toUpperCase();
  if (errorKeys[code]) return errorKeys[code];
  if (code === "SESSION_INCOMPLETE") return "login.sessionIncomplete";
  if (error?.status === 401) return "errors.unauthorized";
  if (error?.status === 429) return "errors.chatRateLimited";
  if (/not enough|insufficient/i.test(code)) {
    return /gold/i.test(code) ? "errors.notEnoughGold" : "errors.notEnoughResources";
  }
  if (/player not found/i.test(code)) return "errors.playerNotFound";
  if (/friend request.*(exist|pending)/i.test(code)) return "errors.friendRequestExists";
  if (/rate.?limit/i.test(code)) return "errors.chatRateLimited";
  if (/connection|network|failed to fetch/i.test(code)) return "errors.connection";
  return fallback;
}
