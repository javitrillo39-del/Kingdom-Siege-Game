import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { buildings, sectionTitles } from "../data/gameConfig.js";
import { call } from "../services/api.js";
import { apiErrorKey } from "../i18n/errors.js";
import { formatNumber } from "../i18n/index.js";
import useProductionRates from "../hooks/useProductionRates.js";
import usePresence from "../hooks/usePresence.js";
import ArmyPanel from "../components/ArmyPanel.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import CityPanel from "../components/CityPanel.jsx";
import CommanderPanel from "../components/CommanderPanel.jsx";
import GameHeader from "../components/GameHeader.jsx";
import GameNavigation from "../components/GameNavigation.jsx";
import MapPanel from "../components/MapPanel.jsx";
import SocialPanel from "../components/SocialPanel.jsx";

export default function GamePage({ initial, user, onLogout, onSessionExpired }) {
  const { t, i18n } = useTranslation();
  const [game, setGame] = useState(initial);
  const [panel, setPanel] = useState("city");
  const [message, setMessage] = useState({ key: "commander.legacy" });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const busyRef = useRef(false);
  const toastTimerRef = useRef(null);
  const { rates, recordCollection, resetBaseline } = useProductionRates(initial);
  const presence = usePresence({ userId: user.id, onUnauthorized: onSessionExpired });

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

        if (path === "/game/collect") {
          setMessage({ key: "commander.collecting" });
        } else if (path === "/game/attack") {
          setMessage(data.won
            ? {
                key: "commander.attackVictory",
                values: { reward: formatNumber(data.reward, i18n.resolvedLanguage || i18n.language) },
              }
            : { key: "commander.attackDefeat", values: { enemy: t("map.enemy") } });
        } else if (path === "/game/train") {
          setMessage({ key: "commander.troopsTrained" });
        } else if (path === "/game/repair") {
          setMessage({ key: "commander.wallsRepaired" });
        }

        if (path === "/game/upgrade") {
          const buildingName = buildings[body.type]?.name;
          const level = data.game[body.type];
          const values = {
            building: buildingName ? t(buildingName) : t("city.building"),
            level: formatNumber(level, i18n.resolvedLanguage || i18n.language),
          };
          setMessage({ key: "commander.upgradeSuccess", values });
          notify("success", t("commander.upgradeSuccess", values));
        }
      } catch (error) {
        const errorKey = apiErrorKey(error, "commander.actionFailed");
        setMessage({ key: errorKey });

        if (path === "/game/upgrade") {
          const isResourceError = errorKey === "errors.notEnoughResources" ||
            errorKey === "errors.notEnoughGold";
          notify(
            isResourceError ? "warning" : "error",
            isResourceError
              ? t("commander.notEnoughResources")
              : t(errorKey),
          );
        }
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [i18n.language, i18n.resolvedLanguage, notify, recordCollection, resetBaseline, t],
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
              <span className="eyebrow">{t("sections.commandCenter")}</span>
              <h1 id="section-title">{t(sectionTitles[panel])}</h1>
            </div>
            <span className="commanderGreeting">
              {t("sections.commander", { username: user.username })}
            </span>
          </div>

          {panel === "city" && (
            <CityPanel
              game={game}
              busy={busy}
              rates={rates}
              power={power}
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
          {panel === "social" && <SocialPanel presence={presence} />}
          {panel === "chat" && (
            <ChatPanel username={user.username} onSessionExpired={onSessionExpired} />
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
