import { useEffect, useState } from "react";
import {
  SignIn,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/react";

export default function AuthWrapper({ children }) {
  return (
    <>
      <SignedOut>
        <LoginPage />
      </SignedOut>
      <SignedIn>
        {children}
      </SignedIn>
    </>
  );
}

function LoginPage() {
  return (
    <div className="auth-page">
      <div className="bg-orb orb1" />
      <div className="bg-orb orb2" />
      <div className="bg-orb orb3" />

      <div className="auth-box">
        <div className="logo" style={{ marginBottom: "8px" }}>
          <span className="logo-v">V</span>
          <span className="logo-text">idyaVoice</span>
        </div>
        <p className="tagline" style={{ marginBottom: "28px" }}>
          Your AI tutor — bolo, seekho, samjho
        </p>
        <SignIn
          appearance={{
            elements: {
              rootBox: "clerk-root",
              card: "clerk-card",
              headerTitle: "clerk-title",
              headerSubtitle: "clerk-subtitle",
              socialButtonsBlockButton: "clerk-social-btn",
              formButtonPrimary: "clerk-primary-btn",
              footerActionLink: "clerk-link",
            },
          }}
        />
      </div>
    </div>
  );
}

// Export UserButton for use in header
export { UserButton };