import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, provider, signInWithPopup, signOut, FIREBASE_CONFIG_ERROR } from "../firebase";

export default function AuthWrapper({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return undefined;
    }

    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="auth-page">
        <div className="bg-orb orb1" /><div className="bg-orb orb2" /><div className="bg-orb orb3" />
        <div className="auth-loading">
          <div className="logo"><span className="logo-v">V</span><span className="logo-text">idyaVoice</span></div>
          <div className="auth-spinner" />
        </div>
      </div>
    );
  }

  if (FIREBASE_CONFIG_ERROR) {
    return (
      <div className="auth-page">
        <div className="bg-orb orb1" /><div className="bg-orb orb2" /><div className="bg-orb orb3" />
        <div className="auth-box">
          <div className="logo" style={{ marginBottom: "6px" }}>
            <span className="logo-v">V</span>
            <span className="logo-text">idyaVoice</span>
          </div>
          <p className="tagline" style={{ marginBottom: "20px" }}>
            Your AI tutor - bolo, seekho, samjho
          </p>
          <p style={{ color: "#ffb4b4", lineHeight: 1.6, textAlign: "center" }}>
            {FIREBASE_CONFIG_ERROR}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return children;
}

function LoginPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    try {
      if (!auth || !provider) {
        throw new Error(FIREBASE_CONFIG_ERROR || "Firebase auth is not configured.");
      }

      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="bg-orb orb1" /><div className="bg-orb orb2" /><div className="bg-orb orb3" />
      <div className="auth-box">
        <div className="logo" style={{ marginBottom: "6px" }}>
          <span className="logo-v">V</span>
          <span className="logo-text">idyaVoice</span>
        </div>
        <p className="tagline" style={{ marginBottom: "32px" }}>
          Your AI tutor - bolo, seekho, samjho
        </p>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px", textAlign: "center" }}>
          Sign in to start learning
        </p>

        <button className="google-login-btn" onClick={handleGoogleLogin} disabled={loading}>
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {error && <p style={{ color: "#ff6b6b", fontSize: "0.82rem", marginTop: "12px" }}>{error}</p>}

        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "24px", textAlign: "center", lineHeight: 1.5 }}>
          By signing in, you agree to use VidyaVoice for learning purposes.
        </p>
      </div>
    </div>
  );
}

export function UserAvatar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!auth) return undefined;

    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  if (!auth || !user) return null;

  async function handleSignOut() {
    await signOut(auth);
  }

  return (
    <div className="user-avatar-wrap">
      {user.photoURL
        ? <img src={user.photoURL} alt={user.displayName} className="user-avatar-img" />
        : <div className="user-avatar-fallback">{user.displayName?.[0] || "U"}</div>
      }
      <div className="user-dropdown">
        <p className="user-name">{user.displayName}</p>
        <p className="user-email">{user.email}</p>
        <button className="signout-btn" onClick={handleSignOut}>Sign out</button>
      </div>
    </div>
  );
}
