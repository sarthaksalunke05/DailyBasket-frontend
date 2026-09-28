import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../config";

export default function AuthPage({ setPage, isAdminMode = false }) {
  const [mode, setMode] = useState("login");
  const [adminExists, setAdminExists] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, registerAdmin } = useAuth();

  useEffect(() => {
    if (isAdminMode) {
      fetch(`${API}/auth/check-admin`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setAdminExists(d.exists);
            if (!d.exists) setMode("register");
          }
        })
        .catch((err) => {
          console.error("Error checking admin:", err);
        });
    }
  }, [isAdminMode]);

  const usernameValid = /^[a-zA-Z][a-zA-Z0-9\s._-]{2,31}/.test(username);
  const passwordValid = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/.test(password);

  const handleSubmit = async () => {
    setError("");
    if (!usernameValid || !passwordValid) {
      setError("Please fix the highlighted fields.");
      return;
    }
    setLoading(true);

    let fn;
    if (isAdminMode) {
      fn = mode === "login" ? login : registerAdmin;
    } else {
      fn = mode === "login" ? login : register;
    }

    const res = await fn(username, password);
    setLoading(false);

    if (res.success) {
      if (res.user.role === "admin") setPage("admin");
      else setPage("home");
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={isAdminMode ? { borderColor: "var(--black)", borderWidth: "2px" } : {}}>
        {isAdminMode && (
          <div style={{ fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            Admin Portal
          </div>
        )}
        <h2 className="auth-title">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p className="auth-sub">
          {isAdminMode
            ? (adminExists ? "Login to admin dashboard" : "Register the first admin account")
            : (mode === "login" ? "Login to your ShopG account" : "Join ShopG — it's free")}
        </p>

        {error && <div className="error-msg">{error}</div>}

        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            className={`form-input ${username && (usernameValid ? "valid" : "invalid")}`}
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          {username && !usernameValid && (
            <div className="form-hint err">Must start with a letter, min 3 characters</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className={`form-input ${password && (passwordValid ? "valid" : "invalid")}`}
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          {password && !passwordValid && (
            <div className="form-hint err">Min 6 chars, include uppercase, lowercase &amp; number</div>
          )}
        </div>

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait…" : mode === "login" ? "Login" : "Create Account"}
        </button>

        <div className="auth-switch">
          {isAdminMode ? (
            !adminExists && (
              <>
                New admin?{" "}
                <button onClick={() => { setMode("register"); setError(""); }}>Register</button>
              </>
            )
          ) : (
            mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button onClick={() => { setMode("register"); setError(""); }}>Register</button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => { setMode("login"); setError(""); }}>Login</button>
              </>
            )
          )}
          {isAdminMode && adminExists && mode === "register" && (
             <button onClick={() => setMode("login")}>Back to Login</button>
          )}
        </div>
      </div>
    </div>
  );
}
