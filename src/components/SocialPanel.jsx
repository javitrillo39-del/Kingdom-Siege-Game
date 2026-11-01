import { useMemo, useState } from "react";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Crown,
  Eye,
  Search,
  Shield,
  ShieldOff,
  Swords,
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

function Status({ online }) {
  return (
    <span className={`socialStatus${online ? " online" : ""}`}>
      <Circle size={7} fill="currentColor" aria-hidden="true" />
      {online ? "Online" : "Offline"}
    </span>
  );
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
  showProfile = true,
}) {
  const name = player.displayName || player.username;
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
      <div className="socialPlayerMeta">
        <span><Swords size={13} aria-hidden="true" />{Number(player.power || 0).toLocaleString()} power</span>
        <span><Crown size={13} aria-hidden="true" />{player.realm}</span>
        <Status online={player.online === true} />
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
        {action && (
          <button
            className="primaryButton socialActionButton"
            type="button"
            onClick={action}
            disabled={actionDisabled}
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
  onAdd,
  onRemove,
  onBlock,
  onUnblock,
}) {
  if (!player) return null;
  const name = player.displayName || player.username;

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
      <Status online={player.online === true} />
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
        {!isFriend && !isBlocked && (
          <button className="primaryButton" type="button" onClick={onAdd} disabled={busy || isPending}>
            {isPending ? <Check size={15} /> : <UserPlus size={15} />}
            {isPending ? "Requested" : "Add Friend"}
          </button>
        )}
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

export default function SocialPanel() {
  const social = useSocial();
  const [tab, setTab] = useState("discover");
  const [query, setQuery] = useState("");

  const friendIds = useMemo(
    () => new Set(social.lists.friends.map((player) => player.id)),
    [social.lists.friends],
  );
  const blockedIds = useMemo(
    () => new Set(social.lists.blocked.map((player) => player.id)),
    [social.lists.blocked],
  );
  const pendingIds = useMemo(
    () => new Set(
      social.lists.requests
        .filter((request) => request.direction === "outgoing")
        .map((request) => request.playerId),
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
              aria-label="Search players by username"
              maxLength={20}
              minLength={2}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by username..."
              value={query}
            />
            <button type="submit" className="primaryButton" disabled={social.searching || query.trim().length < 2}>
              {social.searching ? "Searching" : "Search"}
            </button>
          </form>
          <div className="socialList">
            {!hasSearch && <EmptyState>Search for a commander by username to discover their profile.</EmptyState>}
            {hasSearch && !social.searchResults.length && !social.searching && (
              <EmptyState>No players match this search.</EmptyState>
            )}
            {social.searchResults.map((player) => {
              const isFriend = friendIds.has(player.id);
              const isBlocked = blockedIds.has(player.id);
              const pending = pendingIds.has(player.id);
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onView={() => void social.viewPlayer(player.id)}
                  action={!isFriend && !isBlocked ? () => void social.sendRequest(player.id) : null}
                  actionLabel={pending ? "Requested" : "Add Friend"}
                  actionIcon={pending ? Check : UserPlus}
                  actionDisabled={social.busy || pending}
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
            isFriend={friendIds.has(social.selectedPlayer.id)}
            isBlocked={blockedIds.has(social.selectedPlayer.id)}
            isPending={pendingIds.has(social.selectedPlayer.id)}
            busy={social.busy}
            {...playerActions(social.selectedPlayer.id)}
          />
        ) : (
          <SocialAside social={social} incomingCount={incomingCount} onChangeTab={setTab} />
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
              isFriend={friendIds.has(social.selectedPlayer.id)}
              isBlocked={blockedIds.has(social.selectedPlayer.id)}
              isPending={pendingIds.has(social.selectedPlayer.id)}
              busy={social.busy}
              {...playerActions(social.selectedPlayer.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RequestList({ title, eyebrow, items, onView, renderActions }) {
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
            <Status online={request.online === true} />
            <div className="socialCardActions">{renderActions(request)}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SocialAside({ social, incomingCount, onChangeTab }) {
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
          isFriend={social.lists.friends.some((friend) => friend.id === social.selectedPlayer.id)}
          isBlocked={social.lists.blocked.some((player) => player.id === social.selectedPlayer.id)}
          isPending={social.lists.requests.some(
            (request) => request.direction === "outgoing" && request.playerId === social.selectedPlayer.id,
          )}
          busy={social.busy}
          onAdd={() => void social.sendRequest(social.selectedPlayer.id)}
          onRemove={() => void social.removeFriend(social.selectedPlayer.id)}
          onBlock={() => void social.blockPlayer(social.selectedPlayer.id)}
          onUnblock={() => void social.unblockPlayer(social.selectedPlayer.id)}
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
