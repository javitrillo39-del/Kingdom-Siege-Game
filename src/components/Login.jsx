import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Crown, LockKeyhole, Swords } from "lucide-react";
import { call } from "../services/api.js";
import { apiErrorKey } from "../i18n/errors.js";
import LanguageSelector from "./LanguageSelector.jsx";

export default function Login({ onLogin, initialError = "" }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);

  useEffect(() => {
    if (initialError) setError(initialError);
  }, [initialError]);

  async function submit(event) {
    event.preventDefault();
    setError("");

    try {
      const data = await call(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem("ks_token", data.token);
      onLogin(data);
    } catch (requestError) {
      setError(
        apiErrorKey(
          requestError,
          isLogin ? "login.loginFailed" : "login.registerFailed",
        ),
      );
    }
  }

  const isLogin = mode === "login";

  return (
    <main className="login">
      <LanguageSelector />
      <form onSubmit={submit} className="loginCard">
        <div className="loginCrest">
          <Crown size={34} strokeWidth={1.7} />
        </div>
        <span className="eyebrow">{t("login.eyebrow")}</span>
        <h1>KINGDOM SIEGE</h1>
        <p>{isLogin ? t("login.return") : t("login.createCommander")}</p>
        <label className="srOnly" htmlFor="username">
          {t("login.username")}
        </label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder={t("login.username")}
          autoComplete="username"
          required
        />
        <label className="srOnly" htmlFor="password">
          {t("login.password")}
        </label>
        <div className="passwordField">
          <LockKeyhole size={16} aria-hidden="true" />
          <input
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder={t("login.passwordHint")}
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
          />
        </div>
        <button className="primaryButton loginSubmit" type="submit">
          <Swords size={17} />
          {isLogin ? t("login.enter") : t("login.createAccount")}
        </button>
        {error && (
          <div className="error" role="alert">
            {t(error)}
          </div>
        )}
        <button
          className="textButton"
          type="button"
          onClick={() => {
            setError("");
            setMode(isLogin ? "register" : "login");
          }}
        >
          {isLogin ? t("login.newHere") : t("login.existingAccount")}
        </button>
      </form>
    </main>
  );
}
