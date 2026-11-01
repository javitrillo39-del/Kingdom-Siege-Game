const PUBLISHABLE_KEY_PREFIX = "sb_publishable_";
const SAFE_DIAGNOSTICS = new Set([
  "missing_supabase_url",
  "invalid_supabase_url",
  "missing_publishable_key",
  "invalid_publishable_key",
  "supabase_client_configured",
  "presence_session_ready",
  "missing_supabase_jwt_secret",
  "presence_session_failed",
  "incompatible_game_jwt",
  "websocket_open",
  "websocket_failed",
  "presence_channel_subscribed",
  "channel_rejected",
  "presence_track_succeeded",
  "presence_track_failed",
]);

export function inspectSupabaseConfig(url, publishableKey) {
  const issues = [];

  if (typeof url !== "string" || !url.trim()) {
    issues.push("missing_supabase_url");
  } else {
    try {
      const parsedUrl = new URL(url);
      if (
        !["https:", "http:"].includes(parsedUrl.protocol) ||
        (parsedUrl.protocol === "http:" &&
          !["localhost", "127.0.0.1"].includes(parsedUrl.hostname))
      ) {
        issues.push("invalid_supabase_url");
      }
    } catch {
      issues.push("invalid_supabase_url");
    }
  }

  if (typeof publishableKey !== "string" || !publishableKey.trim()) {
    issues.push("missing_publishable_key");
  } else if (!isPublishableKeyWellFormed(publishableKey.trim())) {
    issues.push("invalid_publishable_key");
  }

  return issues;
}

function isPublishableKeyWellFormed(key) {
  if (key.startsWith(PUBLISHABLE_KEY_PREFIX)) {
    return key.length - PUBLISHABLE_KEY_PREFIX.length >= 20;
  }

  const segments = key.split(".");
  return (
    key.length >= 100 &&
    segments.length === 3 &&
    segments.every((segment) => /^[A-Za-z0-9_-]+$/.test(segment))
  );
}

export function hasCompatiblePresenceClaims(token, publicPlayerId) {
  if (typeof token !== "string" || token.length > 4096) return false;
  const segments = token.split(".");
  if (
    segments.length !== 3 ||
    segments.some((segment) => !segment) ||
    !/^[A-Za-z0-9_-]{40,}$/.test(segments[2])
  ) {
    return false;
  }

  try {
    const header = JSON.parse(decodeJwtSegment(segments[0]));
    const claims = JSON.parse(decodeJwtSegment(segments[1]));
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];

    return (
      header.alg === "HS256" &&
      claims.role === "authenticated" &&
      audience.includes("authenticated") &&
      claims.sub === publicPlayerId &&
      Number.isFinite(claims.exp) &&
      claims.exp * 1000 > Date.now()
    );
  } catch {
    return false;
  }
}

function decodeJwtSegment(segment) {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function reportPresenceDiagnostic(code) {
  if (SAFE_DIAGNOSTICS.has(code)) {
    console.info(`[kingdom-presence] ${code}`);
  }
}
