import { authClient } from "~/lib/auth-client";

export default function Login() {
  const signIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", padding: "2rem", textAlign: "center" }}>
      <h1>Sign In</h1>
      <p>Sign in to access your courses and certificates.</p>
      <div style={{ marginTop: "2rem" }}>
        <button
          onClick={signIn}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#4285F4",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
