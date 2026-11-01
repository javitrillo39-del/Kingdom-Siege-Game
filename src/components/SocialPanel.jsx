import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Copy,
  Crown,
  Eye,
  Search,
  Shield,
  ShieldOff,
  Swords,
  Trophy,
  UserMinus,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import useSocial from "../hooks/useSocial.js";
import { formatNumber, intlLocale } from "../i18n/index.js";
import "./social.css";

const tabs = [
  { id: "discover", label: "social.tabs.discover", Icon: Search },
  { id: "friends", label: "social.tabs.friends", Icon: UsersRound },
  { id: "requests", label: "social.tabs.requests", Icon: UserPlus },
  { id: "notifications", label: "social.tabs.notifications", Icon: Bell },
  { id: "blocked", label: "social.tabs.blocked", Icon: Shield },
];

const PUBLIC_PLAYER_ID_PATTERN = /^KS-[A-Z0-9]{8}$/i;

function formatLastSeen(value, t, locale) {
  if (!value) return t("social.offline");
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return t("social.lastSeen");
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return t("social.lastSeenNow");
  if (minutes < 60) return t("social.lastSeenMinutes", { count: formatNumber(minutes, locale) });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("social.lastSeenHours", { count: formatNumber(hours, locale) });
  const days = Math.floor(hours / 24);
  return t("social.lastSeenDays", { count: formatNumber(days, locale) });
}

function Status({ online, available = true, lastSeenAt }) {
  const { t, i18n } = useTranslation();
  const locale = intlLocale(i18n.resolvedLanguage || i18n.language);
  const label = online
    ? t("social.online")
    : available
      ? formatLastSeen(lastSeenAt, t, locale)
      : t("social.unavailable");
  return (
    <span className={`socialStatus${online ? " online" : ""}${available ? "" : " unavailable"}`}>
      <Circle size={7} fill="currentColor" aria-hidden="true" />
      {label}
    </span>
  );
}

function CopyablePlayerId({ id, onCopy }) {
  const { t } = useTranslation();
  if (!id) return null;

  return (
    <div className="socialPlayerId">
      <span>{t("social.playerIdLabel")} <strong>{id}</strong></span>
      <button className="socialCopyButton" type="button" onClick={() => void onCopy(id)}>
        <Copy size={12} aria-hidden="true" />
        {t("common.copy")}
      </button>
    </div>
  );
}

function getPublicPlayerId(player) {
  const id = player?.publicPlayerId ?? player?.id;
  return typeof id === "string" && PUBLIC_PLAYER_ID_PATTERN.test(id) ? id : null;
}

function playerReference(player) {
  return getPublicPlayerId(player) || player.id;
}

function getPresenceStatus(player) {
  const online = player?.online === true;
  return {
    online,
    available: typeof player?.online === "boolean",
    lastSeenAt: online ? undefined : player?.lastSeenAt,
  };
}

function PlayerCard({
  player,
  action,
  actionLabel,
  actionIcon: ActionIcon,
  actionDisabled,
  secondaryAction,
  secondaryLabel,
  onView,
  onCopy,
  showPublicId = false,
  showStatus = true,
  showProfile = true,
  presenceStatus,
}) {
  const { t, i18n } = useTranslation();
  const name = player.username;
  return (
    <article className="socialPlayerCard">
      <button className="socialPlayerIdentity" type="button" onClick={onView} disabled={!showProfile}>
        <span className="socialAvatar" aria-hidden="true">
          {(name || "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="socialPlayerText">
          <strong>{name}</strong>
          <small>@{player.username}</small>
        </span>
      </button>
      {showPublicId && (
        <div className="socialResultPlayerId">
          {getPublicPlayerId(player) && (
            <>
              <span>{t("social.playerId", { id: getPublicPlayerId(player) })}</span>
              <button className="socialCopyButton" type="button" onClick={() => void onCopy(getPublicPlayerId(player))}>
                <Copy size={12} aria-hidden="true" />
                {t("common.copy")}
              </button>
            </>
          )}
        </div>
      )}
      <div className="socialPlayerMeta">
        <span><Swords size={13} aria-hidden="true" />{t("social.powerValue", { value: formatNumber(Number(player.power || 0), i18n.resolvedLanguage || i18n.language) })}</span>
        <span><Crown size={13} aria-hidden="true" />{player.realm}</span>
        <span><Trophy size={13} aria-hidden="true" />{t("social.victoriesValue", { value: formatNumber(Number(player.victories || 0), i18n.resolvedLanguage || i18n.language) })}</span>
        {showStatus && (
          <Status
            {...(presenceStatus || {
              online: false,
              available: false,
              lastSeenAt: player.lastSeenAt,
            })}
          />
        )}
      </div>
      <div className="socialCardActions">
        {showProfile && (
          <button className="socialTextButton" type="button" onClick={onView}>
            <Eye size={14} aria-hidden="true" /> {t("common.profile")}
          </button>
        )}
        {secondaryAction && (
          <button className="socialTextButton danger" type="button" onClick={secondaryAction}>
            {secondaryLabel}
          </button>
        )}
        {(action || actionLabel) && (
          <button
            className={`primaryButton socialActionButton${actionDisabled ? " secondary" : ""}`}
            type="button"
            onClick={action || undefined}
            disabled={actionDisabled || !action}
          >
            {ActionIcon && <ActionIcon size={14} aria-hidden="true" />}
            {actionLabel}
          </button>
        )}
      </div>
    </article>
  );
}

function Pager({ page, items, onChange }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language;
  const canPrevious = page > 1;
  const canNext = items.length === 20;
  return (
    <div className="socialPager">
      <button
        className="socialPagerButton"
        type="button"
        onClick={() => onChange(-1)}
        disabled={!canPrevious}
        aria-label={t("social.previousPage")}
      >
        <ChevronLeft size={16} />
      </button>
      <span>{t("social.page", { page: formatNumber(page, locale) })}</span>
      <button
        className="socialPagerButton"
        type="button"
        onClick={() => onChange(1)}
        disabled={!canNext}
        aria-label={t("social.nextPage")}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function EmptyState({ children }) {
  return <div className="socialEmptyState">{children}</div>;
}

function PlayerProfile({
  player,
  onClose,
  isFriend,
  isBlocked,
  isPending,
  busy,
  presenceStatus,
  onAdd,
  onRemove,
  onBlock,
  onUnblock,
  onCopy,
}) {
  const { t, i18n } = useTranslation();
  if (!player) return null;
  const name = player.username;

  return (
    <aside className="socialProfilePanel" aria-label={t("social.playerProfile")}>
      <div className="socialProfileTopline">
        <span className="eyebrow">{t("social.playerDossier")}</span>
        <button className="socialIconButton" type="button" onClick={onClose} aria-label={t("social.closeProfile")}>
          <X size={16} />
        </button>
      </div>
      <div className="socialProfileCrest">{name.slice(0, 1).toUpperCase()}</div>
      <h2>{name}</h2>
      <span className="socialHandle">@{player.username}</span>
      <CopyablePlayerId id={getPublicPlayerId(player)} onCopy={onCopy} />
      <Status
        {...(presenceStatus || {
          online: false,
          available: false,
          lastSeenAt: player.lastSeenAt,
        })}
      />
      <p className="socialProfileBio">{player.bio || t("social.bioMissing")}</p>
      <div className="socialProfileRealm">
        <Crown size={15} aria-hidden="true" />
        <span><small>{t("social.realm")}</small><strong>{player.realm}</strong></span>
      </div>
      <div className="socialProfileStats">
        <div><small>{t("map.power")}</small><strong>{formatNumber(Number(player.power || 0), i18n.resolvedLanguage || i18n.language)}</strong></div>
        <div><small>{t("common.victories")}</small><strong>{formatNumber(Number(player.victories || 0), i18n.resolvedLanguage || i18n.language)}</strong></div>
      </div>
      <div className="socialProfileActions">
        <button
          className={`primaryButton socialRelationshipButton${isFriend || isBlocked || isPending ? " secondary" : ""}`}
          type="button"
          onClick={isFriend || isBlocked || isPending ? undefined : onAdd}
          disabled={busy || isFriend || isBlocked || isPending}
        >
          {isFriend ? <Check size={15} /> : isBlocked ? <Shield size={15} /> : isPending ? <Check size={15} /> : <UserPlus size={15} />}
          {isFriend ? t("social.friends") : isBlocked ? t("social.blockedStatus") : isPending ? t("social.requestSent") : t("social.addFriend")}
        </button>
        {isFriend && (
          <button className="socialTextButton danger" type="button" onClick={onRemove} disabled={busy}>
            <UserMinus size={15} /> {t("social.removeFriend")}
          </button>
        )}
        {isBlocked ? (
          <button className="socialTextButton" type="button" onClick={onUnblock} disabled={busy}>
            <ShieldOff size={15} /> {t("social.unblock")}
          </button>
        ) : (
          <button className="socialTextButton danger" type="button" onClick={onBlock} disabled={busy}>
            <Shield size={15} /> {t("common.block")}
          </button>
        )}
      </div>
    </aside>
  );
}

export default function SocialPanel({ presence }) {
  const { t, i18n } = useTranslation();
  const locale = intlLocale(i18n.resolvedLanguage || i18n.language);
  const social = useSocial();
  const [tab, setTab] = useState("discover");
  const [query, setQuery] = useState("");
  const [copyNotice, setCopyNotice] = useState(null);
  const copyTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  async function copyPlayerId(playerId) {
    try {
      await navigator.clipboard.writeText(playerId);
      setCopyNotice({ type: "success", text: t("social.copySuccess") });
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopyNotice(null), 3000);
    } catch {
      setCopyNotice({ type: "error", text: t("social.copyFailure") });
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopyNotice(null), 5000);
    }
  }

  const friendNames = useMemo(
    () => new Set(social.lists.friends.map((player) => player.username.toLowerCase())),
    [social.lists.friends],
  );
  const blockedNames = useMemo(
    () => new Set(social.lists.blocked.map((player) => player.username.toLowerCase())),
    [social.lists.blocked],
  );
  const pendingNames = useMemo(
    () => new Set(
      social.lists.requests
        .filter((request) => request.direction === "outgoing")
        .map((request) => request.username.toLowerCase()),
    ),
    [social.lists.requests],
  );
  const incomingCount = social.lists.requests.filter(
    (request) => request.direction === "incoming",
  ).length;

  const playerActions = (playerId) => ({
    onAdd: () => social.sendRequest(playerId),
    onRemove: () => social.removeFriend(playerId),
    onBlock: () => social.blockPlayer(playerId),
    onUnblock: () => social.unblockPlayer(playerId),
  });

  function renderPagination(key, page, items) {
    return (
      <Pager
        page={page}
        items={items}
        onChange={(direction) => {
          void social.changePage(key, direction);
        }}
      />
    );
  }

  function renderDiscover() {
    const hasSearch = Boolean(social.searchQuery);
    return (
      <div className="socialDirectory">
        <section className="socialSectionCard">
          <div className="socialSectionHeading">
            <div>
              <span className="eyebrow">{t("social.explore")}</span>
              <h2>{t("social.findCommanders")}</h2>
            </div>
            <span className="socialCount">{hasSearch ? formatNumber(social.searchResults.length, locale) : "—"}</span>
          </div>
          <form
            className="socialSearchForm"
            onSubmit={(event) => {
              event.preventDefault();
              void social.search(query);
            }}
          >
            <Search size={17} aria-hidden="true" />
            <input
              aria-label={t("social.searchAria")}
              maxLength={20}
              minLength={2}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("social.searchPlaceholder")}
              value={query}
            />
            <button type="submit" className="primaryButton" disabled={social.searching || query.trim().length < 2}>
              {social.searching ? t("social.searching") : t("common.search")}
            </button>
          </form>
          <div className="socialList">
            {!hasSearch && <EmptyState>{t("social.searchPrompt")}</EmptyState>}
            {hasSearch && social.searching && <EmptyState>{t("social.searchingPlayers")}</EmptyState>}
            {hasSearch && !social.searchResults.length && !social.searching && (
              <EmptyState>{t("social.noSearchResults")}</EmptyState>
            )}
            {social.searchResults.map((player) => {
              const relationship = player.friendshipStatus;
              return (
                <PlayerCard
                  key={getPublicPlayerId(player) || player.username}
                  player={player}
                  onView={() => void social.viewPlayer(playerReference(player))}
                  onCopy={copyPlayerId}
                  showPublicId
                  showStatus={false}
                  action={relationship === "none" ? () => void social.sendRequest(playerReference(player)) : null}
                  actionLabel={t(relationship === "pending" ? "social.requestSent" : relationship === "friends" ? "social.friends" : relationship === "blocked" ? "social.blockedStatus" : "social.addFriend")}
                  actionIcon={relationship === "none" ? UserPlus : relationship === "blocked" ? Shield : Check}
                  actionDisabled={social.busy || relationship !== "none"}
                />
              );
            })}
          </div>
          {hasSearch && renderPagination("search", social.searchPage, social.searchResults)}
        </section>
        {social.selectedPlayer ? (
          <PlayerProfile
            player={social.selectedPlayer}
            onClose={social.closeProfile}
            isFriend={social.selectedPlayer.friendshipStatus === "friends" || friendNames.has(social.selectedPlayer.username.toLowerCase())}
            isBlocked={social.selectedPlayer.friendshipStatus === "blocked" || blockedNames.has(social.selectedPlayer.username.toLowerCase())}
            isPending={social.selectedPlayer.friendshipStatus === "pending" || pendingNames.has(social.selectedPlayer.username.toLowerCase())}
            busy={social.busy}
            onCopy={copyPlayerId}
            presenceStatus={getPresenceStatus(social.selectedPlayer)}
            {...playerActions(playerReference(social.selectedPlayer))}
          />
        ) : (
          <SocialAside
            social={social}
            incomingCount={incomingCount}
            onChangeTab={setTab}
            onCopy={copyPlayerId}
            presence={presence}
          />
        )}
      </div>
    );
  }

  function renderFriends() {
    return (
      <section className="socialSectionCard">
        <div className="socialSectionHeading">
          <div><span className="eyebrow">{t("social.yourAllies")}</span><h2>{t("social.friends")}</h2></div>
          <span className="socialCount">{formatNumber(social.lists.friends.length, locale)}</span>
        </div>
        <div className="socialList">
          {social.lists.friends.length === 0 && <EmptyState>{t("social.emptyFriends")}</EmptyState>}
          {social.lists.friends.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onView={() => void social.viewPlayer(player.id)}
              presenceStatus={getPresenceStatus(player)}
              secondaryAction={() => void social.removeFriend(player.id)}
              secondaryLabel={<><UserMinus size={14} /> {t("social.remove")}</>}
            />
          ))}
        </div>
        {renderPagination("friends", social.pages.friends, social.lists.friends)}
      </section>
    );
  }

  function renderRequests() {
    const incoming = social.lists.requests.filter((request) => request.direction === "incoming");
    const outgoing = social.lists.requests.filter((request) => request.direction === "outgoing");
    return (
      <div className="socialRequestGrid">
        <RequestList
          title={t("social.received")}
          eyebrow={t("social.incoming")}
          direction="incoming"
          items={incoming}
          onView={social.viewPlayer}
          presence={presence}
          renderActions={(request) => (
            <>
              <button className="primaryButton socialActionButton" type="button" disabled={social.busy} onClick={() => void social.acceptRequest(request.id)}>
                <Check size={14} /> {t("social.accept")}
              </button>
              <button className="socialTextButton danger" type="button" disabled={social.busy} onClick={() => void social.rejectRequest(request.id)}>
                <X size={14} /> {t("social.reject")}
              </button>
            </>
          )}
        />
        <RequestList
          title={t("social.sent")}
          eyebrow={t("social.outgoing")}
          direction="outgoing"
          items={outgoing}
          onView={social.viewPlayer}
          presence={presence}
          renderActions={() => <span className="socialPendingLabel">{t("social.awaitingResponse")}</span>}
        />
        {renderPagination("requests", social.pages.requests, social.lists.requests)}
      </div>
    );
  }

  function renderNotifications() {
    return (
      <section className="socialSectionCard">
        <div className="socialSectionHeading">
          <div><span className="eyebrow">{t("social.kingdomDispatches")}</span><h2>{t("social.notifications")}</h2></div>
          <span className="socialCount">{formatNumber(social.lists.notifications.length, locale)}</span>
        </div>
        <div className="socialList">
          {social.lists.notifications.length === 0 && <EmptyState>{t("social.emptyNotifications")}</EmptyState>}
          {social.lists.notifications.map((notice) => (
            <article className="socialNotice" key={notice.id}>
              <span className="socialNoticeIcon"><Bell size={16} /></span>
              <span className="socialNoticeText">
                <strong>
                  {notice.type === "friend_request_accepted"
                    ? t("social.acceptedRequest", { name: notice.actorDisplayName || t("social.somePlayer") })
                    : t("social.sentRequest", { name: notice.actorDisplayName || t("social.somePlayer") })}
                </strong>
                <small>{notice.realm} · {formatDate(notice.createdAt, t, locale)}</small>
              </span>
              {notice.actorId && (
                <button className="socialIconButton" type="button" onClick={() => void social.viewPlayer(notice.actorId)} aria-label={t("social.viewPlayerProfile")}>
                  <Eye size={15} />
                </button>
              )}
            </article>
          ))}
        </div>
        {renderPagination("notifications", social.pages.notifications, social.lists.notifications)}
      </section>
    );
  }

  function renderBlocked() {
    return (
      <section className="socialSectionCard">
        <div className="socialSectionHeading">
          <div><span className="eyebrow">{t("social.accountControls")}</span><h2>{t("social.blockedPlayers")}</h2></div>
          <span className="socialCount">{formatNumber(social.lists.blocked.length, locale)}</span>
        </div>
        <div className="socialList">
          {social.lists.blocked.length === 0 && <EmptyState>{t("social.noneBlocked")}</EmptyState>}
          {social.lists.blocked.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              showProfile={false}
              onView={() => void social.viewPlayer(player.id)}
              presenceStatus={getPresenceStatus(player)}
              action={() => void social.unblockPlayer(player.id)}
              actionLabel={t("social.unblock")}
              actionIcon={ShieldOff}
              actionDisabled={social.busy}
            />
          ))}
        </div>
        {renderPagination("blocked", social.pages.blocked, social.lists.blocked)}
      </section>
    );
  }

  const sections = {
    discover: renderDiscover,
    friends: renderFriends,
    requests: renderRequests,
    notifications: renderNotifications,
    blocked: renderBlocked,
  };

  return (
    <div className="socialView">
      <div className="socialToolbar">
        <div>
          <span className="eyebrow">{t("social.playerNetwork")}</span>
          <p>{t("social.toolbarSearch")}</p>
        </div>
        <button className="socialRefreshButton" type="button" onClick={() => void social.reload()} disabled={social.loading}>
          <span className="socialLiveMark" /> {social.loading ? t("social.syncing") : t("social.liveRealm")}
        </button>
      </div>

      <div className="socialIdentityBanner">
        <div>
          <span className="eyebrow">{t("social.myProfile")}</span>
          <strong>{social.myProfile?.username || (social.loading ? t("common.loadingData") : t("common.unavailable"))}</strong>
          <CopyablePlayerId id={getPublicPlayerId(social.myProfile)} onCopy={copyPlayerId} />
        </div>
        <div>
          <span className="eyebrow">{t("social.registeredPlayers")}</span>
          <strong>{social.registeredPlayers != null ? formatNumber(social.registeredPlayers, locale) : (social.loading ? t("common.loadingData") : t("common.unavailable"))}</strong>
        </div>
        <div>
          <span className="eyebrow">{t("social.onlineNow")}</span>
          <strong>
            {presence?.onlineCount !== null && presence?.onlineCount !== undefined &&
            presence?.connection !== "unavailable"
              ? (
                <>
                  {formatNumber(presence.onlineCount, locale)}
                  {presence.connection === "updating" && (
                    <small className="socialPresenceUpdating">{t("social.updating")}</small>
                  )}
                </>
              )
              : presence?.connection === "unavailable"
                ? t("social.onlineUnavailable")
                : t("social.connecting")}
          </strong>
        </div>
      </div>
      {copyNotice && (
        <div
          className={`socialCopyNotice${copyNotice.type === "error" ? " error" : ""}`}
          role={copyNotice.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {copyNotice.text}
        </div>
      )}

      <div className="socialTabs" role="tablist" aria-label={t("social.sections")}>
        {tabs.map(({ id, label, Icon }) => (
          <button
            className={`socialTab${tab === id ? " active" : ""}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              social.closeProfile();
            }}
            key={id}
          >
            <Icon size={15} aria-hidden="true" />
            {t(label)}
            {id === "requests" && incomingCount > 0 && <span className="socialTabBadge">{formatNumber(incomingCount, locale)}</span>}
            {id === "notifications" && social.lists.notifications.length > 0 && (
              <span className="socialTabBadge">{formatNumber(social.lists.notifications.length, locale)}</span>
            )}
          </button>
        ))}
      </div>

      {social.error && (
        <div className="socialError" role="alert">
          <span>{t(social.error)}</span>
          <button type="button" onClick={social.clearError} aria-label={t("common.dismissError")}><X size={15} /></button>
        </div>
      )}

      {social.loading ? (
        <div className="socialLoading" role="status">{t("social.loadingSocial")}</div>
      ) : (
        sections[tab]()
      )}

      {social.selectedPlayer && tab !== "discover" && (
        <div className="socialProfileOverlay" role="presentation" onClick={social.closeProfile}>
          <div role="presentation" onClick={(event) => event.stopPropagation()}>
            <PlayerProfile
              player={social.selectedPlayer}
              onClose={social.closeProfile}
              isFriend={social.selectedPlayer.friendshipStatus === "friends" || friendNames.has(social.selectedPlayer.username.toLowerCase())}
              isBlocked={social.selectedPlayer.friendshipStatus === "blocked" || blockedNames.has(social.selectedPlayer.username.toLowerCase())}
              isPending={social.selectedPlayer.friendshipStatus === "pending" || pendingNames.has(social.selectedPlayer.username.toLowerCase())}
              busy={social.busy}
              onCopy={copyPlayerId}
              presenceStatus={getPresenceStatus(social.selectedPlayer)}
              {...playerActions(playerReference(social.selectedPlayer))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RequestList({ title, eyebrow, direction, items, onView, presence, renderActions }) {
  const { t, i18n } = useTranslation();
  return (
    <section className="socialSectionCard">
      <div className="socialSectionHeading">
        <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
        <span className="socialCount">{formatNumber(items.length, i18n.resolvedLanguage || i18n.language)}</span>
      </div>
      <div className="socialList">
        {items.length === 0 && <EmptyState>{t(`social.no${direction === "incoming" ? "Incoming" : "Outgoing"}Requests`)}</EmptyState>}
        {items.map((request) => (
          <article className="socialRequestCard" key={request.id}>
            <button className="socialPlayerIdentity" type="button" onClick={() => void onView(request.playerId)}>
              <span className="socialAvatar" aria-hidden="true">
                {(request.displayName || request.username || "?").slice(0, 1).toUpperCase()}
              </span>
              <span className="socialPlayerText">
                <strong>{request.displayName || request.username}</strong>
                <small>@{request.username} · {request.realm}</small>
              </span>
            </button>
            <Status {...getPresenceStatus(request)} />
            <div className="socialCardActions">{renderActions(request)}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SocialAside({ social, incomingCount, onChangeTab, onCopy, presence }) {
  const { t, i18n } = useTranslation();
  const notices = social.lists.notifications.slice(0, 3);
  return (
    <aside className="socialAside">
      <div className="socialAsideCard socialRealmCard">
        <div className="socialAsideIcon"><Crown size={19} /></div>
        <span className="eyebrow">{t("social.yourWorld")}</span>
        <h3>{t("common.realm")} 07</h3>
        <p>{t("social.worldDescription")}</p>
      </div>
      <button className="socialAsideCard socialInboxCard" type="button" onClick={() => onChangeTab("requests")}>
        <span className="socialAsideHeader"><UserPlus size={16} /> {t("social.friendRequests")}</span>
        <strong>{formatNumber(incomingCount, i18n.resolvedLanguage || i18n.language)}</strong>
        <small>{t("social.receivedRequests")}</small>
      </button>
      <div className="socialAsideCard">
        <div className="socialAsideHeader"><Bell size={16} /> {t("social.latestNotices")}</div>
        {notices.length === 0 ? (
          <p className="socialAsideEmpty">{t("social.noDispatches")}</p>
        ) : (
          notices.map((notice) => (
            <div className="socialAsideNotice" key={notice.id}>
              <span className="socialNoticeDot" />
              <span>{notice.actorDisplayName || t("social.somePlayer")} {notice.type === "friend_request_accepted" ? t("social.acceptedNotice") : t("social.sentNotice")}</span>
            </div>
          ))
        )}
        <button className="socialTextButton" type="button" onClick={() => onChangeTab("notifications")}>
          {t("social.viewAllNotices")}
        </button>
      </div>
      {social.selectedPlayer && (
        <PlayerProfile
          player={social.selectedPlayer}
          onClose={social.closeProfile}
          isFriend={social.selectedPlayer.friendshipStatus === "friends" || social.lists.friends.some((friend) => friend.username === social.selectedPlayer.username)}
          isBlocked={social.selectedPlayer.friendshipStatus === "blocked" || social.lists.blocked.some((player) => player.username === social.selectedPlayer.username)}
          isPending={social.selectedPlayer.friendshipStatus === "pending" || social.lists.requests.some(
            (request) => request.direction === "outgoing" && request.username === social.selectedPlayer.username,
          )}
          busy={social.busy}
          presenceStatus={getPresenceStatus(social.selectedPlayer)}
          onAdd={() => void social.sendRequest(playerReference(social.selectedPlayer))}
          onRemove={() => void social.removeFriend(playerReference(social.selectedPlayer))}
          onBlock={() => void social.blockPlayer(playerReference(social.selectedPlayer))}
          onUnblock={() => void social.unblockPlayer(playerReference(social.selectedPlayer))}
          onCopy={onCopy}
        />
      )}
    </aside>
  );
}

function formatDate(value, t, locale) {
  if (!value) return t("social.justNow");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("social.recent");
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}
