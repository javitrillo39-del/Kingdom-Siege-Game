import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Circle,
  Flag,
  LockKeyhole,
  MessageCircle,
  Send,
  ShieldBan,
  Volume2,
  VolumeX,
} from "lucide-react";
import useChat from "../hooks/useChat.js";
import { intlLocale, formatNumber } from "../i18n/index.js";
import "./chat.css";

function formatMessageTime(value, locale) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date);
}

function presenceLabel(online, t) {
  return online ? t("common.online") : t("common.offline");
}

function channelName(channel, t) {
  if (channel?.type === "global") return t("chat.global");
  if (channel?.type === "realm") return t("chat.realmChannel", { realm: channel.realm });
  return channel?.name;
}

export default function ChatPanel({ username, onSessionExpired }) {
  const { t, i18n } = useTranslation();
  const locale = intlLocale(i18n.resolvedLanguage || i18n.language);
  const chat = useChat({ onUnauthorized: onSessionExpired });
  const [draft, setDraft] = useState("");
  const [reportingId, setReportingId] = useState(null);
  const privatePlayers = useMemo(() => {
    const players = new Map();
    for (const player of [...chat.privatePlayers, ...chat.conversations]) {
      players.set(player.publicPlayerId, player);
    }
    return [...players.values()].sort((left, right) => left.username.localeCompare(right.username));
  }, [chat.conversations, chat.privatePlayers]);

  const selectedPeer = chat.selectedChannel?.type === "private"
    ? privatePlayers.find(player => player.publicPlayerId === chat.selectedChannel.publicPlayerId) ||
      chat.selectedChannel
    : null;
  const isMuted = Boolean(
    selectedPeer && chat.mutedPlayers.some(player => player.publicPlayerId === selectedPeer.publicPlayerId),
  );
  const connectionText = chat.loadingMessages
      ? t("chat.loadingMessages")
      : chat.connection === "connected"
        ? t("chat.connected")
        : chat.connection === "lost"
          ? chat.channels.length ? t("chat.connectionLost") : t("chat.chatUnavailable")
          : chat.connection === "reconnecting"
            ? t("chat.reconnecting")
            : t("chat.loadingMessages");

  async function submitMessage(event) {
    event.preventDefault();
    if (!draft.trim() || chat.sending) return;
    const sent = await chat.sendMessage(draft);
    if (sent) setDraft("");
  }

  async function report(messageId) {
    setReportingId(messageId);
    await chat.reportMessage(messageId);
    setReportingId(null);
  }

  async function blockSelectedPlayer() {
    if (!selectedPeer || !window.confirm(t("chat.blockConfirmation", { username: selectedPeer.username }))) return;
    await chat.blockPlayer(selectedPeer);
  }

  return (
    <section className="chatView" aria-label={t("chat.view")}>
      <aside className="chatChannels" aria-label={t("chat.channels")}>
        <div className="chatColumnHeading">
          <span className="eyebrow">{t("chat.channels")}</span>
          <MessageCircle size={16} aria-hidden="true" />
        </div>
        {chat.loadingChannels && <div className="chatListStatus">{t("chat.loadingChannels")}</div>}
        {chat.channels.map(channel => (
          <button
            className={`chatChannelButton${String(chat.selectedChannel?.id) === String(channel.id) ? " active" : ""}`}
            key={channel.id}
            onClick={() => chat.selectChannel(channel)}
            type="button"
          >
            <MessageCircle size={15} aria-hidden="true" />
            <span>{channelName(channel, t)}</span>
          </button>
        ))}
        <div className="chatColumnHeading chatPrivateHeading">
          <span className="eyebrow">{t("chat.private")}</span>
          <LockKeyhole size={15} aria-hidden="true" />
        </div>
        {privatePlayers.length === 0 && !chat.loadingChannels && (
          <p className="chatListStatus">{t("chat.friendsHere")}</p>
        )}
        {privatePlayers.map(player => {
          const conversation = chat.conversations.find(item => item.publicPlayerId === player.publicPlayerId);
          const selected = chat.selectedChannel?.publicPlayerId === player.publicPlayerId;
          return (
            <button
              className={`chatContactButton${selected ? " active" : ""}`}
              key={player.publicPlayerId}
              onClick={() => void chat.openPrivate(player)}
              type="button"
            >
              <span className={`chatAvatar${player.online ? " online" : ""}`}>
                {(player.username || "?").slice(0, 1).toUpperCase()}
              </span>
              <span className="chatContactText">
                <strong>{player.username}</strong>
                <small>{presenceLabel(player.online, t)}</small>
              </span>
              {conversation && <span className="chatConversationMark" aria-label={t("chat.conversationExists")} />}
            </button>
          );
        })}
      </aside>

      <section className="chatConversation" aria-label={t("chat.conversation")}>
        <header className="chatConversationHeader">
          <div className="chatConversationTitle">
            <span className="chatHeaderIcon"><MessageCircle size={17} aria-hidden="true" /></span>
            <div>
              <span className="eyebrow">{t("chat.dispatch")}</span>
              <h2>{channelName(chat.selectedChannel, t) || selectedPeer?.username || t("chat.chooseChannel")}</h2>
            </div>
          </div>
          <span className={`chatConnection chatConnection-${chat.connection}`}>
            <Circle size={7} fill="currentColor" aria-hidden="true" />
            {connectionText}
          </span>
        </header>

        {chat.error && (
          <div className="chatNotice chatNotice-error" role="status">
            <AlertTriangle size={14} aria-hidden="true" />
            <span>{t(chat.error)}</span>
          </div>
        )}

        <div className="chatMessageList" aria-live="polite">
          {chat.hasEarlier && (
            <button
              className="chatLoadEarlier"
              onClick={() => void chat.loadEarlier()}
              disabled={chat.loadingOlder}
              type="button"
            >
              {chat.loadingOlder ? t("chat.loading") : t("chat.loadEarlier")}
            </button>
          )}
          {chat.loadingMessages && chat.messages.length === 0 && (
            <div className="chatEmpty">{t("chat.loadingMessages")}</div>
          )}
          {!chat.loadingMessages && chat.connection !== "lost" && chat.messages.length === 0 && chat.selectedChannel && (
            <div className="chatEmpty">{t("chat.noMessages")}</div>
          )}
          {chat.connection === "lost" && chat.messages.length === 0 && (
            <div className="chatEmpty">{t("chat.connectionRetry")}</div>
          )}
          {chat.messages.map(message => (
            <article
              className={`chatMessage${message.username === username ? " own" : ""}`}
              key={message.id}
            >
              <div className="chatMessageHeading">
                <strong>{message.username}</strong>
                <span className="chatMessagePlayerId">{message.publicPlayerId}</span>
                <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt, locale)}</time>
                <button
                  className="chatReportButton"
                  type="button"
                  aria-label={t("chat.reportFrom", { username: message.username })}
                  title={t("chat.reportMessage")}
                  disabled={reportingId === message.id}
                  onClick={() => void report(message.id)}
                >
                  <Flag size={13} aria-hidden="true" />
                  <span>{reportingId === message.id ? t("chat.sending") : t("chat.reportMessage")}</span>
                </button>
              </div>
              <p>{message.messageText}</p>
            </article>
          ))}
        </div>

        <form className="chatComposer" onSubmit={submitMessage}>
          <label className="srOnly" htmlFor="chat-message-input">{t("chat.writeMessage")}</label>
          <textarea
            id="chat-message-input"
            onChange={event => setDraft(Array.from(event.target.value).slice(0, 300).join(""))}
            placeholder={t("chat.plainTextPlaceholder")}
            rows={2}
            value={draft}
          />
          <div className="chatComposerFooter">
            <span>{t("chat.characters", { count: formatNumber(Array.from(draft).length, locale) })}</span>
            <button
              className="primaryButton"
              disabled={!chat.selectedChannel || !draft.trim() || chat.sending || chat.connection !== "connected"}
              type="submit"
            >
              <Send size={14} aria-hidden="true" />
              {chat.sending ? t("chat.sending") : t("chat.send")}
            </button>
          </div>
        </form>
        {(chat.actionStatus || chat.connection === "reconnecting") && (
          <div className="chatActionStatus" role="status">
            {t(chat.actionStatus || "chat.reconnecting")}
          </div>
        )}
      </section>

      <aside className="chatDetails" aria-label={selectedPeer ? t("chat.playerDetails") : t("chat.channelDetails")}>
        <span className="eyebrow">{selectedPeer ? t("chat.playerDetails") : t("chat.channelDetails")}</span>
        {selectedPeer ? (
          <>
            <div className="chatDetailAvatar">{(selectedPeer.username || "?").slice(0, 1).toUpperCase()}</div>
            <h3>{selectedPeer.username}</h3>
            <span className="chatDetailPlayerId">{selectedPeer.publicPlayerId}</span>
            <span className={`chatPresenceLabel${selectedPeer.online ? " online" : ""}`}>
              <Circle size={8} fill="currentColor" aria-hidden="true" />
              {presenceLabel(selectedPeer.online, t)}
            </span>
            <div className="chatDetailActions">
              <button className="chatUtilityButton" type="button" onClick={() => void chat.toggleMute(selectedPeer)}>
                {isMuted ? <Volume2 size={14} /> : <VolumeX size={14} />}
                {isMuted ? t("chat.unmute") : t("chat.mute")}
              </button>
              <button className="chatUtilityButton danger" type="button" onClick={() => void blockSelectedPlayer()}>
                <ShieldBan size={14} />
                {t("chat.block")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="chatDetailAvatar"><MessageCircle size={20} aria-hidden="true" /></div>
            <h3>{channelName(chat.selectedChannel, t) || t("chat.channel")}</h3>
            <p>
              {chat.selectedChannel?.type === "global"
                ? t("chat.globalDescription")
                : chat.selectedChannel?.type === "realm"
                  ? t("chat.realmDescription", { realm: chat.selectedChannel.realm })
                  : t("chat.privatePrompt")}
            </p>
            <div className="chatRule"><LockKeyhole size={14} /> {t("chat.plainTextRule")}</div>
            <div className="chatRule"><AlertTriangle size={14} /> {t("chat.reportRule")}</div>
          </>
        )}
      </aside>
    </section>
  );
}
