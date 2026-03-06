import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "./Auth.css";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef(null);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const redirectTo = location.state?.from || "/dashboard";
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const parseApiResponse = async (response) => {
    const raw = await response.text();

    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(
        `Auth API did not return JSON. Check backend at ${API_BASE_URL} and restart frontend after env changes.`
      );
    }
  };

  const finishLogin = useCallback(
    (token) => {
      localStorage.setItem("token", token);
      navigate(redirectTo, { replace: true });
    },
    [navigate, redirectTo]
  );

  const handleGoogleResponse = useCallback(
    async (response) => {
      if (!response?.credential) return;

      setGoogleLoading(true);
      setGoogleError("");

      try {
        const apiResponse = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await parseApiResponse(apiResponse);

        if (!apiResponse.ok) {
          throw new Error(data.message || "Google sign-in failed");
        }

        finishLogin(data.token);
      } catch (error) {
        setGoogleError(error.message || "Google sign-in failed");
      } finally {
        setGoogleLoading(false);
      }
    },
    [finishLogin]
  );

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id) return;

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: googleButtonRef.current.clientWidth || 360,
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [googleClientId, handleGoogleResponse]);

  const handleAuth = async () => {
    if (!email || !password) {
      alert("Please fill email and password.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin
        ? `${API_BASE_URL}/api/auth/login`
        : `${API_BASE_URL}/api/auth/register`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await parseApiResponse(response);

      if (!response.ok) {
        alert(data.message || "Something went wrong");
        return;
      }

      if (isLogin) {
        finishLogin(data.token);
      } else {
        alert("Account created. Please sign in.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <p className="auth-brand-badge">Nexus3D</p>
          <h1>Print smarter, faster.</h1>
          <p>Secure account access for quotes, orders, and production tracking.</p>
        </div>

        <div className="auth-form-wrap">
          <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
          <p className="auth-sub">
            {isLogin ? "Sign in to continue." : "Register to manage quotes and payments."}
          </p>

          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="auth-btn" onClick={handleAuth} disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          {googleClientId ? (
            <>
              <div className="google-btn-wrap" ref={googleButtonRef} />
              {googleLoading && <p className="auth-note">Verifying Google sign-in...</p>}
              {googleError && <p className="auth-error">{googleError}</p>}
            </>
          ) : (
            <p className="auth-note">
              Google sign-in is disabled. Add <code>VITE_GOOGLE_CLIENT_ID</code> in frontend
              env to enable it.
            </p>
          )}

          <p className="auth-switch">
            {isLogin ? "No account yet?" : "Already registered?"}
            <button
              type="button"
              className="auth-link"
              onClick={() => setIsLogin((prev) => !prev)}
            >
              {isLogin ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
