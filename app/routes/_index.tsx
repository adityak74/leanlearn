import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "leanlearn - Minimal Course Platform" },
    { name: "description", content: "A very lean course platform deployed on Cloudflare stack." },
  ];
};

export default function Index() {
  return (
    <div style={{ fontFamily: "Inter, sans-serif", lineHeight: "1.6", padding: "2rem" }}>
      <h1>Welcome to leanlearn</h1>
      <p>A lean course platform inspired by LearnHouse, built with Better Auth, Hono, and Cloudflare D1.</p>
      <div style={{ marginTop: "2rem" }}>
        <a href="/login" style={{ padding: "0.5rem 1rem", backgroundColor: "#0070f3", color: "white", textDecoration: "none", borderRadius: "5px" }}>
          Get Started
        </a>
      </div>
    </div>
  );
}
