import { useEffect, useState } from "react";
import { Crown, LockKeyhole, Swords } from "lucide-react";
import { call } from "../services/api.js";

export default function Login({ onLogin, initialError = "" }) {
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
      setError(requestError.message);
    }
  }

  const isLogin = mode === "login";

  return (
    <main className="login">
      <form onSubmit={submit} className="loginCard">
        <div className="loginCrest">
          <Crown size={34} strokeWidth={1.7} />
        </div>
        <span className="eyebrow">A REALM AWAITS</span>
        <h1>KINGDOM SIEGE</h1>
        <p>{isLogin ? "Return to your kingdom" : "Create your commander"}</p>
        <label className="srOnly" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Username"
          autoComplete="username"
          required
        />
        <label className="srOnly" htmlFor="password">
          Password
        </label>
        <div className="passwordField">
          <LockKeyhole size={16} aria-hidden="true" />
          <input
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password (8+ characters)"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
          />
        </div>
        <button className="primaryButton loginSubmit" type="submit">
          <Swords size={17} />
          {isLogin ? "Enter the kingdom" : "Create your account"}
        </button>
        {error && (
          <div className="error" role="alert">
            {error}
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
          {isLogin ? "New here? Create an account" : "I already have an account"}
        </button>
      </form>
    </main>
  );
}
