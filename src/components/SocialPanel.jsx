import { useEffect, useMemo, useRef, useState } from "react";
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
import "./social.css";

const tabs = [
  { id: "discover", label: "Find players", Icon: Search },
  { id: "friends", label: "Friends", Icon: UsersRound },
  { id: "requests", label: "Requests", Icon: UserPlus },
  { id: "notifications", label: "Notices", Icon: Bell },
  { id: "blocked", label: "Blocked", Icon: Shield },
];

const PUBLIC_PLAYER_ID_PATTERN = /^KS-[A-Z0-9]{8}$/i;

function formatLastSeen(value) {
  if (!value) return "Offline";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Last seen";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Last seen just now";
  if (minutes < 60) return `Last seen ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Last seen ${days}d ago`;
}

function Status({ online, available = true, lastSeenAt }) {
  const label = online
    ? "Online"
    : available
      ? formatLastSeen(lastSeenAt)
      : "Unavailable";
  return (
    <span className={`socialStatus${online ? " online" : ""}${available ? "" : " unavailable"}`}>
      <Circle size={7} fill="currentColor" aria-hidden="true" />
      {label}
    </span>
  );
}

function CopyablePlayerId({ id, onCopy }) {
  if (!id) return null;

  return (
    <div className="socialPlayerId">
      <span>Player ID: <strong>{id}</strong></span>
      <button className="socialCopyButton" type="button" onClick={() => void onCopy(id)}>
        <Copy size={12} aria-hidden="true" />
        Copy
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

function relationshipLabel(status) {
  if (status === "pending") return "Request sent";
  if (status === "friends") return "Friends";
  if (status === "blocked") return "Blocked";
  return "Add Friend";
}

function getPresenceStatus(player, presence) {
  const publicPlayerId = getPublicPlayerId(player);
  return {
    online: Boolean(publicPlayerId && presence?.onlinePlayerIds?.has(publicPlayerId)),
    available: presence?.available === true,
    lastSeenAt: player.lastSeenAt,
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
              <span>Player ID: <strong>{getPublicPlayerId(player)}</strong></span>
              <button className="socialCopyButton" type="button" onClick={() => void onCopy(getPublicPlayerId(player))}>
                <Copy size={12} aria-hidden="true" />
                Copy
              </button>
            </>
          )}
        </div>
      )}
      <div className="socialPlayerMeta">
        <span><Swords size={13} aria-hidden="true" />{Number(player.power || 0).toLocaleString()} power</span>
        <span><Crown size={13} aria-hidden="true" />{player.realm}</span>
        <span><Trophy size={13} aria-hidden="true" />{Number(player.victories || 0).toLocaleString()} victories</span>
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
            <Eye size={14} aria-hidden="true" /> Profile
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
  const canPrevious = page > 1;
  const canNext = items.length === 20;
  return (
    <div className="socialPager">
      <button
        className="socialPagerButton"
        type="button"
        onClick={() => onChange(-1)}
        disabled={!canPrevious}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      <span>Page {page}</span>
      <button
        className="socialPagerButton"
        type="button"
        onClick={() => onChange(1)}
        disabled={!canNext}
        aria-label="Next page"
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
  if (!player) return null;
  const name = player.username;

  return (
    <aside className="socialProfilePanel" aria-label="Player profile">
      <div className="socialProfileTopline">
        <span className="eyebrow">PLAYER DOSSIER</span>
        <button className="socialIconButton" type="button" onClick={onClose} aria-label="Close profile">
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
      <p className="socialProfileBio">{player.bio || "This commander has not added a profile description."}</p>
      <div className="socialProfileRealm">
        <Crown size={15} aria-hidden="true" />
        <span><small>REALM</small><strong>{player.realm}</strong></span>
      </div>
      <div className="socialProfileStats">
        <div><small>POWER</small><strong>{Number(player.power || 0).toLocaleString()}</strong></div>
        <div><small>VICTORIES</small><strong>{Number(player.victories || 0).toLocaleString()}</strong></div>
      </div>
      <div className="socialProfileActions">
        <button
          className={`primaryButton socialRelationshipButton${isFriend || isBlocked || isPending ? " secondary" : ""}`}
          type="button"
          onClick={isFriend || isBlocked || isPending ? undefined : onAdd}
          disabled={busy || isFriend || isBlocked || isPending}
        >
          {isFriend ? <Check size={15} /> : isBlocked ? <Shield size={15} /> : isPending ? <Check size={15} /> : <UserPlus size={15} />}
          {isFriend ? "Friends" : isBlocked ? "Blocked" : isPending ? "Request sent" : "Add Friend"}
        </button>
        {isFriend && (
          <button className="socialTextButton danger" type="button" onClick={onRemove} disabled={busy}>
            <UserMinus size={15} /> Remove friend
          </button>
        )}
        {isBlocked ? (
          <button className="socialTextButton" type="button" onClick={onUnblock} disabled={busy}>
            <ShieldOff size={15} /> Unblock
          </button>
        ) : (
          <button className="socialTextButton danger" type="button" onClick={onBlock} disabled={busy}>
            <Shield size={15} /> Block
          </button>
        )}
      </div>
    </aside>
  );
}

export default function SocialPanel({ presence }) {
  const social = useSocial();
  const [tab, setTab] = useState("discover");
  const [query, setQuery] = useState("");
  const [copyNotice, setCopyNotice] = useState(null);
  const copyTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  async function copyPlayerId(playerId) {
    try {
      await navigator.clipboard.writeText(playerId);
      setCopyNotice({ type: "success", text: "Player ID copied" });
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopyNotice(null), 3000);
    } catch {
      setCopyNotice({ type: "error", text: "Could not copy Player ID. Please copy it manually." });
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
              <span className="eyebrow">EXPLORE THE REALM</span>
              <h2>Find commanders</h2>
            </div>
            <span className="socialCount">{hasSearch ? social.searchResults.length : "—"}</span>
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
              aria-label="Search players by username or public ID"
              maxLength={20}
              minLength={2}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by username or Player ID"
              value={query}
            />
            <button type="submit" className="primaryButton" disabled={social.searching || query.trim().length < 2}>
              {social.searching ? "Searching" : "Search"}
            </button>
          </form>
          <div className="socialList">
            {!hasSearch && <EmptyState>Search by username or Player ID to discover a commander.</EmptyState>}
            {hasSearch && social.searching && <EmptyState>Searching players...</EmptyState>}
            {hasSearch && !social.searchResults.length && !social.searching && (
              <EmptyState>No players match this search.</EmptyState>
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
                  actionLabel={relationshipLabel(relationship)}
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
            presenceStatus={getPresenceStatus(social.selectedPlayer, presence)}
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
          <div><span className="eyebrow">YOUR ALLIES</span><h2>Friends</h2></div>
          <span className="socialCount">{social.lists.friends.length}</span>
        </div>
        <div className="socialList">
          {social.lists.friends.length === 0 && <EmptyState>Your friend list is empty.</EmptyState>}
          {social.lists.friends.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onView={() => void social.viewPlayer(player.id)}
              presenceStatus={getPresenceStatus(player, presence)}
              secondaryAction={() => void social.removeFriend(player.id)}
              secondaryLabel={<><UserMinus size={14} /> Remove</>}
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
          title="Received"
          eyebrow="INCOMING"
          items={incoming}
          onView={social.viewPlayer}
          presence={presence}
          renderActions={(request) => (
            <>
              <button className="primaryButton socialActionButton" type="button" disabled={social.busy} onClick={() => void social.acceptRequest(request.id)}>
                <Check size={14} /> Accept
              </button>
              <button className="socialTextButton danger" type="button" disabled={social.busy} onClick={() => void social.rejectRequest(request.id)}>
                <X size={14} /> Reject
              </button>
            </>
          )}
        />
        <RequestList
          title="Sent"
          eyebrow="OUTGOING"
          items={outgoing}
          onView={social.viewPlayer}
          presence={presence}
          renderActions={() => <span className="socialPendingLabel">Awaiting response</span>}
        />
        {renderPagination("requests", social.pages.requests, social.lists.requests)}
      </div>
    );
  }

  function renderNotifications() {
    return (
      <section className="socialSectionCard">
        <div className="socialSectionHeading">
          <div><span className="eyebrow">KINGDOM DISPATCHES</span><h2>Notifications</h2></div>
          <span className="socialCount">{social.lists.notifications.length}</span>
        </div>
        <div className="socialList">
          {social.lists.notifications.length === 0 && <EmptyState>No social notifications yet.</EmptyState>}
          {social.lists.notifications.map((notice) => (
            <article className="socialNotice" key={notice.id}>
              <span className="socialNoticeIcon"><Bell size={16} /></span>
              <span className="socialNoticeText">
                <strong>
                  {notice.type === "friend_request_accepted"
                    ? `${notice.actorDisplayName || "A player"} accepted your friend request`
                    : `${notice.actorDisplayName || "A player"} sent you a friend request`}
                </strong>
                <small>{notice.realm} · {formatDate(notice.createdAt)}</small>
              </span>
              {notice.actorId && (
                <button className="socialIconButton" type="button" onClick={() => void social.viewPlayer(notice.actorId)} aria-label="View player profile">
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
          <div><span className="eyebrow">ACCOUNT CONTROLS</span><h2>Blocked players</h2></div>
          <span className="socialCount">{social.lists.blocked.length}</span>
        </div>
        <div className="socialList">
          {social.lists.blocked.length === 0 && <EmptyState>No players are blocked.</EmptyState>}
          {social.lists.blocked.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              showProfile={false}
              onView={() => void social.viewPlayer(player.id)}
              presenceStatus={getPresenceStatus(player, presence)}
              action={() => void social.unblockPlayer(player.id)}
              actionLabel="Unblock"
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
          <span className="eyebrow">PLAYER NETWORK</span>
          <p>Find commanders, manage friendships, and follow kingdom dispatches.</p>
        </div>
        <button className="socialRefreshButton" type="button" onClick={() => void social.reload()} disabled={social.loading}>
          <span className="socialLiveMark" /> {social.loading ? "Syncing..." : "Live realm"}
        </button>
      </div>

      <div className="socialIdentityBanner">
        <div>
          <span className="eyebrow">MY PROFILE</span>
          <strong>{social.myProfile?.username || (social.loading ? "Loading..." : "Unavailable")}</strong>
          <CopyablePlayerId id={getPublicPlayerId(social.myProfile)} onCopy={copyPlayerId} />
        </div>
        <div>
          <span className="eyebrow">REGISTERED PLAYERS</span>
          <strong>{social.registeredPlayers?.toLocaleString() ?? (social.loading ? "Loading..." : "Unavailable")}</strong>
        </div>
        <div>
          <span className="eyebrow">ONLINE NOW</span>
          <strong>
            {presence?.available
              ? presence.onlineCount.toLocaleString()
              : presence?.connection === "connecting"
                ? "Connecting..."
                : "Online unavailable"}
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

      <div className="socialTabs" role="tablist" aria-label="Social sections">
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
            {label}
            {id === "requests" && incomingCount > 0 && <span className="socialTabBadge">{incomingCount}</span>}
            {id === "notifications" && social.lists.notifications.length > 0 && (
              <span className="socialTabBadge">{social.lists.notifications.length}</span>
            )}
          </button>
        ))}
      </div>

      {social.error && (
        <div className="socialError" role="alert">
          <span>{social.error}</span>
          <button type="button" onClick={social.clearError} aria-label="Dismiss error"><X size={15} /></button>
        </div>
      )}

      {social.loading ? (
        <div className="socialLoading" role="status">Loading social data from the realm...</div>
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
              presenceStatus={getPresenceStatus(social.selectedPlayer, presence)}
              {...playerActions(playerReference(social.selectedPlayer))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RequestList({ title, eyebrow, items, onView, presence, renderActions }) {
  return (
    <section className="socialSectionCard">
      <div className="socialSectionHeading">
        <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
        <span className="socialCount">{items.length}</span>
      </div>
      <div className="socialList">
        {items.length === 0 && <EmptyState>No {title.toLowerCase()} requests.</EmptyState>}
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
            <Status {...getPresenceStatus(request, presence)} />
            <div className="socialCardActions">{renderActions(request)}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SocialAside({ social, incomingCount, onChangeTab, onCopy, presence }) {
  const notices = social.lists.notifications.slice(0, 3);
  return (
    <aside className="socialAside">
      <div className="socialAsideCard socialRealmCard">
        <div className="socialAsideIcon"><Crown size={19} /></div>
        <span className="eyebrow">YOUR WORLD</span>
        <h3>Realm 07</h3>
        <p>One realm, many kingdoms. Player details are loaded from the live game API.</p>
      </div>
      <button className="socialAsideCard socialInboxCard" type="button" onClick={() => onChangeTab("requests")}>
        <span className="socialAsideHeader"><UserPlus size={16} /> Friend requests</span>
        <strong>{incomingCount}</strong>
        <small>received requests</small>
      </button>
      <div className="socialAsideCard">
        <div className="socialAsideHeader"><Bell size={16} /> Latest notices</div>
        {notices.length === 0 ? (
          <p className="socialAsideEmpty">No dispatches yet.</p>
        ) : (
          notices.map((notice) => (
            <div className="socialAsideNotice" key={notice.id}>
              <span className="socialNoticeDot" />
              <span>{notice.actorDisplayName || "A player"} {notice.type === "friend_request_accepted" ? "accepted your request" : "sent a request"}</span>
            </div>
          ))
        )}
        <button className="socialTextButton" type="button" onClick={() => onChangeTab("notifications")}>
          View all notices
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
          presenceStatus={getPresenceStatus(social.selectedPlayer, presence)}
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

function formatDate(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
