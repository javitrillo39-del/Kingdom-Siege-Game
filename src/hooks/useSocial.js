import { useCallback, useEffect, useState } from "react";
import { getSocialPageInfo, socialApi } from "../services/socialApi.js";

const emptyLists = {
  friends: [],
  requests: [],
  notifications: [],
  blocked: [],
};

const emptyPages = {
  friends: 1,
  requests: 1,
  notifications: 1,
  blocked: 1,
};

const listLoaders = {
  friends: async (page) => {
    const data = await socialApi.getFriends(page);
    return data.friends;
  },
  requests: async (page) => {
    const data = await socialApi.getRequests(page);
    return data.requests;
  },
  notifications: async (page) => {
    const data = await socialApi.getNotifications(page);
    return data.notifications;
  },
  blocked: async (page) => {
    const data = await socialApi.getBlockedPlayers(page);
    return data.blockedPlayers;
  },
};

export default function useSocial() {
  const [lists, setLists] = useState(emptyLists);
  const [pages, setPages] = useState(emptyPages);
  const [searchResults, setSearchResults] = useState([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [registeredPlayers, setRegisteredPlayers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadList = useCallback(async (key, page) => {
    const items = await listLoaders[key](page);
    setLists((current) => ({ ...current, [key]: items }));
    setPages((current) => current[key] === page ? current : ({ ...current, [key]: page }));
    return items;
  }, []);

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [profile, stats] = await Promise.all([
        socialApi.getMyProfile(),
        socialApi.getPlayerStats(),
        ...Object.keys(listLoaders).map((key) => loadList(key, pages[key])),
      ]);
      setMyProfile(profile);
      setRegisteredPlayers(stats.registeredPlayers);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not load social data.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [loadList, pages]);

  useEffect(() => {
    void reload();
    const intervalId = window.setInterval(() => void reload(true), 30_000);
    return () => window.clearInterval(intervalId);
  }, [reload]);

  const search = useCallback(async (query, page = 1) => {
    const normalized = query.trim();
    setSearchQuery(normalized);
    setSearchPage(page);
    if (!normalized) {
      setSearchResults([]);
      setError("");
      return;
    }

    setSearchResults([]);
    setSearching(true);
    setError("");
    try {
      const data = await socialApi.searchPlayers(normalized, page);
      setSearchResults(data.players);
    } catch (requestError) {
      setSearchResults([]);
      setError(requestError.message || "Player search failed.");
    } finally {
      setSearching(false);
    }
  }, []);

  const viewPlayer = useCallback(async (playerId) => {
    setSelectedPlayer(null);
    setError("");
    try {
      const data = await socialApi.getPlayer(playerId);
      setSelectedPlayer(data.player);
    } catch (requestError) {
      setError(requestError.message || "Could not load this profile.");
    }
  }, []);

  const perform = useCallback(async (operation, { closeProfile = false } = {}) => {
    setBusy(true);
    setError("");
    try {
      await operation();
      await reload(true);
      if (searchQuery) await search(searchQuery, searchPage);
      if (closeProfile) {
        setSelectedPlayer(null);
      } else if (selectedPlayer) {
        const data = await socialApi.getPlayer(selectedPlayer.publicPlayerId || selectedPlayer.id);
        setSelectedPlayer(data.player);
      }
      return true;
    } catch (requestError) {
      setError(requestError.message || "Social action failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }, [reload, search, searchPage, searchQuery, selectedPlayer]);

  const changePage = useCallback(async (key, direction) => {
    const currentPage = key === "search" ? searchPage : pages[key];
    const items = key === "search" ? searchResults : lists[key];
    const { hasPrevious, hasNext } = getSocialPageInfo(currentPage, items);
    const nextPage = currentPage + direction;
    if ((direction < 0 && !hasPrevious) || (direction > 0 && !hasNext)) return;

    if (key === "search") {
      await search(searchQuery, nextPage);
      return;
    }
    try {
      await loadList(key, nextPage);
    } catch (requestError) {
      setError(requestError.message || "Could not load this page.");
    }
  }, [lists, loadList, pages, search, searchPage, searchQuery, searchResults]);

  return {
    lists,
    pages,
    searchResults,
    searchPage,
    searchQuery,
    selectedPlayer,
    myProfile,
    registeredPlayers,
    loading,
    searching,
    busy,
    error,
    search,
    viewPlayer,
    closeProfile: () => setSelectedPlayer(null),
    clearError: () => setError(""),
    changePage,
    reload: () => reload(),
    sendRequest: (playerId) => perform(() => socialApi.sendFriendRequest(playerId)),
    acceptRequest: (requestId) => perform(() => socialApi.acceptFriendRequest(requestId)),
    rejectRequest: (requestId) => perform(() => socialApi.rejectFriendRequest(requestId)),
    removeFriend: (playerId) => perform(() => socialApi.removeFriend(playerId)),
    blockPlayer: (playerId) => perform(
      () => socialApi.blockPlayer(playerId),
      { closeProfile: true },
    ),
    unblockPlayer: (playerId) => perform(() => socialApi.unblockPlayer(playerId)),
  };
}
