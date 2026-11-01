import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  startPresenceSession,
  updatePresenceSection,
} from "../services/presenceApi.js";
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

    if (!userId || !supabaseUrl || !supabasePublishableKey) {
      setUnavailable("Supabase Realtime is not configured.");
      return () => {
        disposed = true;
      };
    }

    connectionRef.current = "connecting";
    setConnection("connecting");

    async function connect() {
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

        profileRef.current = {
          publicPlayerId: presence.publicPlayerId,
          username: presence.username,
          realm: presence.realm,
        };
        initialSection = presence.activeSection;

        client = createClient(supabaseUrl, supabasePublishableKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        });
        await client.realtime.setAuth(accessToken);

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
          .subscribe(async (status) => {
            if (disposed) return;
            if (status === "SUBSCRIBED") {
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
              } catch {
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
              setUnavailable("Supabase Realtime is unavailable.");
            }
          });
      } catch {
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
        setError("Could not update the current section in presence.");
      }
    }).catch(() => {
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
