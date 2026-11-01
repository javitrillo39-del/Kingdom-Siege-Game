import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildings, sectionTitles } from "../data/gameConfig.js";
import { call } from "../services/api.js";
import useProductionRates from "../hooks/useProductionRates.js";
import ArmyPanel from "../components/ArmyPanel.jsx";
import CityPanel from "../components/CityPanel.jsx";
import CommanderPanel from "../components/CommanderPanel.jsx";
import GameHeader from "../components/GameHeader.jsx";
import GameNavigation from "../components/GameNavigation.jsx";
import MapPanel from "../components/MapPanel.jsx";

export default function GamePage({ initial, user, onLogout }) {
  const [game, setGame] = useState(initial);
  const [panel, setPanel] = useState("city");
  const [message, setMessage] = useState("Welcome to your kingdom.");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const busyRef = useRef(false);
  const toastTimerRef = useRef(null);
  const { rates, recordCollection, resetBaseline } = useProductionRates(initial);

  const power = useMemo(
    () => game.troops * 5 + game.castle * 20 + game.barracks * 8,
    [game],
  );

  const notify = useCallback((type, text) => {
    window.clearTimeout(toastTimerRef.current);
    setToast({ type, text, id: Date.now() });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const action = useCallback(
    async (path, body = {}) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);

      try {
        const data = await call(path, {
          method: "POST",
          body: JSON.stringify(body),
        });
        setGame(data.game);

        if (path === "/game/collect") {
          recordCollection(data.game);
        } else {
          resetBaseline(data.game);
        }

        if (data.message) {
          setMessage(data.message);
        } else if (path === "/game/attack") {
          setMessage(
            data.won
              ? `Victory! +${data.reward} gold`
              : `Defeat against ${data.enemy || "the enemy"}`,
          );
        }

        if (path === "/game/upgrade") {
          const buildingName = buildings[body.type]?.name || body.type;
          const level = data.game[body.type];
          notify(
            "success",
            data.message || `${buildingName} upgraded to level ${level}.`,
          );
        }
      } catch (error) {
        const errorMessage = error.message || "Connection error";
        setMessage(errorMessage);

        if (path === "/game/upgrade") {
          const isResourceError =
            /not enough|insufficient|resource|afford/i.test(errorMessage);
          notify(
            isResourceError ? "warning" : "error",
            isResourceError
              ? `Not enough resources. ${errorMessage}`
              : errorMessage,
          );
        }
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [notify, recordCollection, resetBaseline],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      action("/game/collect", { seconds: 3 });
    }, 3000);
    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(toastTimerRef.current);
    };
  }, [action]);

  return (
    <main className="app">
      <GameHeader game={game} power={power} />
      <div className="layout">
        <GameNavigation
          activePanel={panel}
          onChange={setPanel}
          onLogout={onLogout}
        />
        <section className="gameContent" aria-labelledby="section-title">
          <div className="title">
            <div>
              <span className="eyebrow">COMMAND CENTER</span>
              <h1 id="section-title">{sectionTitles[panel]}</h1>
            </div>
            <span className="commanderGreeting">
              Commander: <b>{user.username}</b>
            </span>
          </div>

          {panel === "city" && (
            <CityPanel
              game={game}
              busy={busy}
              rates={rates}
              onUpgrade={(type) => action("/game/upgrade", { type })}
            />
          )}
          {panel === "army" && (
            <ArmyPanel
              game={game}
              power={power}
              busy={busy}
              onTrain={() => action("/game/train")}
              onRepair={() => action("/game/repair")}
            />
          )}
          {panel === "map" && (
            <MapPanel
              busy={busy}
              onAttack={(enemyId) => action("/game/attack", { enemyId })}
            />
          )}
        </section>
        <CommanderPanel
          user={user}
          game={game}
          busy={busy}
          message={message}
        />
      </div>
      {toast && (
        <div
          className={`gameToast gameToast-${toast.type}`}
          role={toast.type === "error" || toast.type === "warning" ? "alert" : "status"}
          key={toast.id}
        >
          <span className="toastMark" aria-hidden="true">
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <span>{toast.text}</span>
        </div>
      )}
    </main>
  );
}
