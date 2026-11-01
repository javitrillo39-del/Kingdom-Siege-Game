import { useEffect, useState } from "react";
import Login from "./components/Login.jsx";
import GamePage from "./pages/GamePage.jsx";
import { call } from "./services/api.js";
import { logoutPresence } from "./services/presenceApi.js";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem("ks_token")),
  );
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!loading) return undefined;
    let active = true;

    call("/game")
      .then((response) => {
        if (
          !response?.game ||
          !Number.isSafeInteger(response.user?.id) ||
          response.user.id <= 0 ||
          typeof response.user.username !== "string" ||
          !response.user.username.trim()
        ) {
          throw new Error("The saved session is incomplete. Please sign in again.");
        }
        if (active) {
          setSession({ user: response.user, game: response.game });
        }
      })
      .catch((error) => {
        if (active) {
          localStorage.removeItem("ks_token");
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loading]);

  if (loading) {
    return (
      <main className="loading">
        <div className="loadingCard">
          <span className="loadingCrest">✦</span>
          <p>Opening the gates to your kingdom...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return <Login onLogin={setSession} initialError={loadError} />;
  }

  async function logout() {
    let logoutError = "";
    try {
      await logoutPresence();
    } catch (error) {
      logoutError = error.message || "Could not update the last-seen status.";
    } finally {
      localStorage.removeItem("ks_token");
      setLoadError(logoutError);
      setSession(null);
    }
  }

  return (
    <GamePage
      initial={session.game}
      user={session.user}
      onLogout={logout}
    />
  );
}
