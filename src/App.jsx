import { useEffect, useState } from "react";
import Login from "./components/Login.jsx";
import GamePage from "./pages/GamePage.jsx";
import { call } from "./services/api.js";

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
      .then((data) => {
        if (!data?.game) {
          throw new Error("The saved game session is unavailable. Please sign in again.");
        }
        if (active) {
          setSession({ game: data.game, user: { username: "Commander" } });
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

  return (
    <GamePage
      initial={session.game}
      user={session.user}
      onLogout={() => {
        localStorage.removeItem("ks_token");
        setSession(null);
      }}
    />
  );
}
