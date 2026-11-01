import { useCallback, useEffect, useRef, useState } from "react";
import { chatApi } from "../services/chatApi.js";
import { apiErrorKey } from "../i18n/errors.js";

const RETRY_DELAYS = [2_000, 5_000, 10_000];
const POLL_INTERVAL = 3_000;

function mergeMessages(current, incoming) {
  const byId = new Map(current.map(message => [String(message.id), message]));
  for (const message of incoming) byId.set(String(message.id), message);
  return [...byId.values()].sort((left, right) => {
    const timeDifference = Date.parse(left.createdAt) - Date.parse(right.createdAt);
    return timeDifference || String(left.id).localeCompare(String(right.id), undefined, { numeric: true });
  });
}

function mapActionError(error) {
  if (error?.status === 401) return "chat.sessionExpired";
  if (error?.status === 429) return "chat.rateLimit";
  if (error?.status === 409) return "chat.userBlocked";
  if (error?.status === 400 || error?.status === 403) return "chat.rejected";
  return apiErrorKey(error, "chat.unknownError");
}

export default function useChat({ onUnauthorized }) {
  const [channels, setChannels] = useState([]);
  const [privatePlayers, setPrivatePlayers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [mutedPlayers, setMutedPlayers] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState("connecting");
  const [actionStatus, setActionStatus] = useState("");
  const [error, setError] = useState("");
  const [olderPage, setOlderPage] = useState(1);
  const [hasEarlier, setHasEarlier] = useState(false);
  const onUnauthorizedRef = useRef(onUnauthorized);
  const actionStatusTimer = useRef(null);
  const olderRequest = useRef(null);
  const selectedChannelIdRef = useRef(selectedChannel?.id);
  onUnauthorizedRef.current = onUnauthorized;
  selectedChannelIdRef.current = selectedChannel?.id;

  const expireSession = useCallback((requestError) => {
    if (requestError?.status === 401) onUnauthorizedRef.current?.();
  }, []);

  const refreshChannels = useCallback(async (signal) => {
    const data = await chatApi.getChannels({ signal });
    setChannels(data.channels);
    setPrivatePlayers(data.privatePlayers);
    setConversations(data.conversations);
    setMutedPlayers(data.mutedPlayers);
    setSelectedChannel(current => {
      if (current && (
        data.channels.some(channel => String(channel.id) === String(current.id)) ||
        data.conversations.some(channel => String(channel.id) === String(current.id))
      )) {
        const replacement = [...data.channels, ...data.conversations]
          .find(channel => String(channel.id) === String(current.id));
        return replacement || current;
      }
      return data.channels.find(channel => channel.type === "global") || data.channels[0] || null;
    });
    setError("");
    return data;
  }, []);

  useEffect(() => {
    let active = true;
    let controller;
    let timerId;
    let failures = 0;

    async function load() {
      if (!active) return;
      controller = new AbortController();
      setLoadingChannels(true);
      try {
        await refreshChannels(controller.signal);
        if (!active) return;
        failures = 0;
        setConnection("connecting");
        setLoadingChannels(false);
      } catch (requestError) {
        if (!active || requestError.name === "AbortError") return;
        expireSession(requestError);
        if (requestError.status === 401) {
          setLoadingChannels(false);
          return;
        }
        failures += 1;
        setLoadingChannels(false);
        setConnection(failures >= 3 ? "lost" : "reconnecting");
        setError(apiErrorKey(requestError, "chat.unknownError"));
        timerId = window.setTimeout(
          () => void load(),
          RETRY_DELAYS[Math.min(failures - 1, RETRY_DELAYS.length - 1)],
        );
      }
    }

    void load();
    return () => {
      active = false;
      window.clearTimeout(timerId);
      controller?.abort();
    };
  }, [expireSession, refreshChannels]);

  useEffect(() => {
    if (!selectedChannel?.id) {
      setMessages([]);
      setLoadingMessages(false);
      return undefined;
    }

    let active = true;
    let timerId;
    let controller;
    let failures = 0;
    let requestId = 0;
    setMessages([]);
    setOlderPage(1);
    setHasEarlier(false);
    setLoadingMessages(true);
    setConnection("connecting");

    function schedule(delay) {
      if (!active || document.visibilityState === "hidden") return;
      window.clearTimeout(timerId);
      timerId = window.setTimeout(() => void poll(), delay);
    }

    async function poll() {
      if (!active || document.visibilityState === "hidden") return;
      controller = new AbortController();
      const currentRequestId = ++requestId;
      try {
        const data = await chatApi.getMessages(selectedChannel.id, 1, { signal: controller.signal });
        if (!active || currentRequestId !== requestId) return;
        setMessages(current => mergeMessages(current, data.messages));
        setHasEarlier(data.messages.length === 50);
        setLoadingMessages(false);
        setConnection("connected");
        setError("");
        failures = 0;
        schedule(POLL_INTERVAL);
      } catch (requestError) {
        if (!active || requestError.name === "AbortError") return;
        expireSession(requestError);
        if (requestError.status === 401) {
          setLoadingMessages(false);
          return;
        }
        setLoadingMessages(false);
        failures += 1;
        setConnection(failures >= 3 ? "lost" : "reconnecting");
        setError(apiErrorKey(requestError, "chat.connectionLost"));
        schedule(RETRY_DELAYS[Math.min(failures - 1, RETRY_DELAYS.length - 1)]);
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        window.clearTimeout(timerId);
        controller?.abort();
      } else {
        void poll();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    void poll();
    return () => {
      active = false;
      window.clearTimeout(timerId);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [expireSession, selectedChannel?.id]);

  useEffect(() => {
    olderRequest.current?.abort();
    olderRequest.current = null;
    setLoadingOlder(false);
    return () => olderRequest.current?.abort();
  }, [selectedChannel?.id]);

  useEffect(() => () => window.clearTimeout(actionStatusTimer.current), []);

  const showActionStatus = useCallback((status) => {
    window.clearTimeout(actionStatusTimer.current);
    setActionStatus(status);
    actionStatusTimer.current = window.setTimeout(() => setActionStatus(""), 3500);
  }, []);

  const selectChannel = useCallback((channel) => {
    setError("");
    setSelectedChannel(channel);
  }, []);

  const openPrivate = useCallback(async (player) => {
    try {
      setError("");
      const { channel } = await chatApi.openPrivate(player.publicPlayerId);
      setSelectedChannel(channel);
      await refreshChannels();
    } catch (requestError) {
      expireSession(requestError);
      const status = mapActionError(requestError);
      setError(status);
      showActionStatus(status);
    }
  }, [expireSession, refreshChannels, showActionStatus]);

  const sendMessage = useCallback(async (messageText) => {
    if (!selectedChannel?.id || sending) return false;
    const channelId = selectedChannel.id;
    setSending(true);
    showActionStatus("chat.sending");
    try {
      const { message } = await chatApi.sendMessage(channelId, messageText);
      if (String(selectedChannelIdRef.current) === String(channelId)) {
        setMessages(current => mergeMessages(current, [message]));
      }
      showActionStatus("chat.sent");
      return true;
    } catch (requestError) {
      expireSession(requestError);
      const status = mapActionError(requestError);
      setError(status);
      showActionStatus(status);
      return false;
    } finally {
      setSending(false);
    }
  }, [expireSession, selectedChannel?.id, sending, showActionStatus]);

  const loadEarlier = useCallback(async () => {
    if (!selectedChannel?.id || loadingOlder || !hasEarlier) return;
    const channelId = selectedChannel.id;
    const controller = new AbortController();
    olderRequest.current = controller;
    setLoadingOlder(true);
    const page = olderPage + 1;
    try {
      const data = await chatApi.getMessages(channelId, page, { signal: controller.signal });
      if (String(selectedChannelIdRef.current) !== String(channelId)) return;
      setMessages(current => mergeMessages(data.messages, current));
      setHasEarlier(data.messages.length === 50);
      setOlderPage(page);
    } catch (requestError) {
      if (requestError.name === "AbortError") return;
      expireSession(requestError);
      setError(apiErrorKey(requestError, "chat.loadEarlierFailed"));
    } finally {
      if (olderRequest.current === controller) olderRequest.current = null;
      if (String(selectedChannelIdRef.current) === String(channelId)) setLoadingOlder(false);
    }
  }, [expireSession, hasEarlier, loadingOlder, olderPage, selectedChannel?.id]);

  const reportMessage = useCallback(async (messageId) => {
    try {
      await chatApi.reportMessage(messageId);
      showActionStatus("chat.reportSubmitted");
    } catch (requestError) {
      expireSession(requestError);
      const status = mapActionError(requestError);
      setError(status);
      showActionStatus(status);
    }
  }, [expireSession, showActionStatus]);

  const toggleMute = useCallback(async (player) => {
    const muted = mutedPlayers.some(item => item.publicPlayerId === player.publicPlayerId);
    try {
      if (muted) await chatApi.unmutePlayer(player.publicPlayerId);
      else await chatApi.mutePlayer(player.publicPlayerId);
      setMutedPlayers(current => muted
        ? current.filter(item => item.publicPlayerId !== player.publicPlayerId)
        : [...current, { publicPlayerId: player.publicPlayerId, username: player.username }]);
      showActionStatus(muted ? "chat.playerUnmuted" : "chat.playerMuted");
    } catch (requestError) {
      expireSession(requestError);
      const status = mapActionError(requestError);
      setError(status);
      showActionStatus(status);
    }
  }, [expireSession, mutedPlayers, showActionStatus]);

  const blockPlayer = useCallback(async (player) => {
    try {
      await chatApi.blockPlayer(player.publicPlayerId);
      setSelectedChannel(current => current?.publicPlayerId === player.publicPlayerId ? null : current);
      await refreshChannels();
      showActionStatus("chat.userBlocked");
    } catch (requestError) {
      expireSession(requestError);
      const status = mapActionError(requestError);
      setError(status);
      showActionStatus(status);
    }
  }, [expireSession, refreshChannels, showActionStatus]);

  return {
    channels,
    privatePlayers,
    conversations,
    mutedPlayers,
    selectedChannel,
    messages,
    hasEarlier,
    loadingChannels,
    loadingMessages,
    loadingOlder,
    sending,
    connection,
    actionStatus,
    error,
    selectChannel,
    openPrivate,
    sendMessage,
    loadEarlier,
    reportMessage,
    toggleMute,
    blockPlayer,
    refreshChannels: () => refreshChannels(),
  };
}
