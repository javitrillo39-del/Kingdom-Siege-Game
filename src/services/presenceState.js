const PUBLIC_PLAYER_ID_PATTERN = /^KS-[A-Z0-9]{8}$/i;
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
const ALLOWED_SECTIONS = new Set(["City", "Army", "Map", "Social"]);
const PRESENCE_KEYS = new Set([
  "activeSection",
  "presence_ref",
  "publicPlayerId",
  "realm",
  "username",
]);

function isValidPresence(player, key) {
  if (!player || typeof player !== "object" || Array.isArray(player)) return false;
  const keys = Object.keys(player);
  if (
    keys.length < 4 ||
    keys.length > 5 ||
    keys.some((value) => !PRESENCE_KEYS.has(value))
  ) {
    return false;
  }
  return player.publicPlayerId === key &&
    PUBLIC_PLAYER_ID_PATTERN.test(player.publicPlayerId) &&
    USERNAME_PATTERN.test(player.username) &&
    player.realm === "07" &&
    ALLOWED_SECTIONS.has(player.activeSection) &&
    (!Object.hasOwn(player, "presence_ref") || typeof player.presence_ref === "string");
}

export function uniquePresencePlayers(presenceState) {
  const players = new Map();
  for (const [key, presences] of Object.entries(presenceState || {})) {
    for (const player of Array.isArray(presences) ? presences : []) {
      if (isValidPresence(player, key) && !players.has(player.publicPlayerId)) {
        const { activeSection, publicPlayerId, realm, username } = player;
        players.set(publicPlayerId, { activeSection, publicPlayerId, realm, username });
      }
    }
  }
  return [...players.values()];
}
