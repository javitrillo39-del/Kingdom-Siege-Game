import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  startPresenceSession,
  updatePresenceSection,
} from "../services/presenceApi.js";
import {
  hasCompatiblePresenceClaims,
  inspectSupabaseConfig,
  reportPresenceDiagnostic,
} from "../services/presenceDiagnostics.js";
import { uniquePresencePlayers } from "../services/presenceState.js";

const PRESENCE_TOPIC = "kingdom-presence";
const PUBLIC_PLAYER_ID_PATTERN = /^KS-[A-Z0-9]{8}$/i;
const ALLOWED_SECTIONS = new Set(["City", "Army", "Map", "Social"]);

export default function usePresence({ userId, activeSection }) {
  const [connection, setConnection] = useState("connecting");
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState("");
  const activeSectionRef = useRef(activeSection);
  const channelRef = useRef(null);
  const profileRef = useRef(null);
  const connectionRef = useRef("connecting");

  activeSectionRef.current = activeSection;
  connectionRef.current = connection;

  useEffect(() => {
    let disposed = false;
    let channel;
    let client;
    let initialSection;
    let hasSubscribed = false;
    let lastSeenInterval;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
    const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
    const configIssues = inspectSupabaseConfig(supabaseUrl, supabasePublishableKey);

    channelRef.current = null;
    profileRef.current = null;
    setPlayers([]);
    setError("");

    const setUnavailable = (message) => {
      if (disposed) return;
      connectionRef.current = "unavailable";
      setConnection("unavailable");
      setPlayers([]);
      setError(message);
    };

    if (configIssues.length) {
      configIssues.forEach(reportPresenceDiagnostic);
      setUnavailable("Supabase Realtime is not configured.");
      return () => {
        disposed = true;
      };
    }
    if (!userId) {
      setUnavailable("Sign in to connect to Supabase Realtime.");
      return () => {
        disposed = true;
      };
    }

    connectionRef.current = "connecting";
    setConnection("connecting");

    async function connect() {
      let stage = "presence_session";
      try {
        const session = await startPresenceSession(activeSectionRef.current);
        if (disposed) return;
        const { accessToken, presence } = session;
        if (
          typeof accessToken !== "string" ||
          !presence ||
          !PUBLIC_PLAYER_ID_PATTERN.test(presence.publicPlayerId) ||
          !/^[A-Za-z0-9_]{3,20}$/.test(presence.username) ||
          presence.realm !== "07" ||
          !ALLOWED_SECTIONS.has(presence.activeSection)
        ) {
          throw new Error("The presence session response is invalid.");
        }

        if (!hasCompatiblePresenceClaims(accessToken, presence.publicPlayerId)) {
          reportPresenceDiagnostic("incompatible_game_jwt");
          setUnavailable("The presence token is not compatible with Realtime.");
          return;
        }

        profileRef.current = {
          publicPlayerId: presence.publicPlayerId,
          username: presence.username,
          realm: presence.realm,
        };
        initialSection = presence.activeSection;

        stage = "client_init";
        client = createClient(supabaseUrl, supabasePublishableKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        });
        reportPresenceDiagnostic("supabase_client_configured");
        stage = "set_auth";
        await client.realtime.setAuth(accessToken);

        stage = "channel_subscribe";
        channel = client.channel(PRESENCE_TOPIC, {
          config: {
            private: true,
            presence: { key: presence.publicPlayerId },
          },
        });
        channelRef.current = channel;
        channel
          .on("presence", { event: "sync" }, () => {
            if (!disposed) setPlayers(uniquePresencePlayers(channel.presenceState()));
          })
          .subscribe(async (status, err) => {
            if (disposed) return;
            if (status === "SUBSCRIBED") {
              reportPresenceDiagnostic("websocket_open");
              reportPresenceDiagnostic("presence_channel_subscribed");
              connectionRef.current = "connected";
              setConnection("connected");
              setError("");
              try {
                const currentSection = activeSectionRef.current;
                const trackResult = await channel.track({
                  ...profileRef.current,
                  activeSection: currentSection,
                });
                if (trackResult !== "ok") {
                  throw new Error("Supabase did not accept the presence state.");
                }
                reportPresenceDiagnostic("presence_track_succeeded");
              } catch {
                reportPresenceDiagnostic("presence_track_failed");
                setUnavailable("Could not publish presence. Online status is unavailable.");
                return;
              }

              if (hasSubscribed || activeSectionRef.current !== initialSection) {
                try {
                  await updatePresenceSection(activeSectionRef.current);
                  initialSection = activeSectionRef.current;
                } catch {
                  setError("Could not update the last-seen status.");
                }
              }
              hasSubscribed = true;
              reportPresenceDiagnostic("presence_session_ready");
              if (!lastSeenInterval) {
                lastSeenInterval = window.setInterval(() => {
                  void updatePresenceSection(activeSectionRef.current).catch(() => {
                    setError("Could not update the last-seen status.");
                  });
                }, 60_000);
              }
            } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
              window.clearInterval(lastSeenInterval);
              lastSeenInterval = null;
              if (!client.realtime.isConnected()) {
                reportPresenceDiagnostic("websocket_failed");
              } else if (isJwtRejection(err)) {
                reportPresenceDiagnostic("incompatible_game_jwt");
              } else {
                reportPresenceDiagnostic("channel_rejected");
              }
              setUnavailable("Supabase Realtime is unavailable.");
            }
          });
      } catch (error) {
        if (stage === "presence_session") {
          reportPresenceDiagnostic(
            error instanceof Error && error.message === "Realtime presence is not configured"
              ? "missing_supabase_jwt_secret"
              : "presence_session_failed",
          );
        } else if (stage === "set_auth") {
          reportPresenceDiagnostic("incompatible_game_jwt");
        } else if (stage === "channel_subscribe") {
          reportPresenceDiagnostic("websocket_failed");
        } else {
          reportPresenceDiagnostic("presence_session_failed");
        }
        setUnavailable("Could not connect to Supabase Realtime. Online status is unavailable.");
      }
    }

    void connect();

    return () => {
      disposed = true;
      window.clearInterval(lastSeenInterval);
      channelRef.current = null;
      profileRef.current = null;
      if (channel && client) void client.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    const channel = channelRef.current;
    const profile = profileRef.current;
    if (!channel || !profile || connectionRef.current !== "connected") return;

    void channel.track({ ...profile, activeSection }).then((result) => {
      if (result !== "ok") {
        reportPresenceDiagnostic("presence_track_failed");
        setError("Could not update the current section in presence.");
      } else {
        reportPresenceDiagnostic("presence_track_succeeded");
      }
    }).catch(() => {
      reportPresenceDiagnostic("presence_track_failed");
      setError("Could not update the current section in presence.");
    });
    void updatePresenceSection(activeSection).catch(() => {
      setError("Could not update the last-seen status.");
    });
  }, [activeSection]);

  const onlinePlayerIds = useMemo(
    () => new Set(players.map((player) => player.publicPlayerId)),
    [players],
  );

  return {
    available: connection === "connected",
    connection,
    error,
    onlineCount: onlinePlayerIds.size,
    onlinePlayerIds,
  };
}

function isJwtRejection(error) {
  return error instanceof Error && /\b(jwt|token|signature|claim)\b/i.test(error.message);
}
