"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [adminname, setAdminname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminname, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

        .al-root {
          font-family: 'DM Sans', sans-serif;
        }

        .al-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .al-dot {
          animation: al-pulse 2s ease-in-out infinite;
        }

        @keyframes al-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .al-input {
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .al-input:focus {
          outline: none;
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
        }

        .al-btn {
          transition: background 0.15s, transform 0.1s, opacity 0.15s;
        }

        .al-btn:hover:not(:disabled) {
          background: #5558e8;
        }

        .al-btn:active:not(:disabled) {
          transform: scale(0.99);
        }
      `}</style>

      <div
        className="al-root al-grid"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0c0e",
          padding: "2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow accent */}
        <div
          style={{
            position: "absolute",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
            top: -120,
            right: -120,
            pointerEvents: "none",
          }}
        />

        {/* Card */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 400,
            background: "#111114",
            border: "0.5px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: "2rem",
            zIndex: 1,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#6366f1",
              background: "rgba(99,102,241,0.1)",
              border: "0.5px solid rgba(99,102,241,0.3)",
              borderRadius: 6,
              padding: "4px 10px",
              marginBottom: "1.25rem",
            }}
          >
            <div
              className="al-dot"
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#6366f1",
              }}
            />
            admin console
          </div>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: "#f4f4f5",
              margin: "0 0 4px",
              letterSpacing: "-0.02em",
            }}
          >
            Sign in
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#71717a",
              margin: "0 0 1.75rem",
              fontWeight: 300,
            }}
          >
            Access requires administrator credentials
          </p>

          <form onSubmit={handleSubmit}>
            {/* Admin name */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#52525b",
                  marginBottom: 8,
                }}
              >
                Admin name
              </label>
              <input
                className="al-input"
                type="text"
                value={adminname}
                onChange={(e) => setAdminname(e.target.value)}
                required
                autoComplete="username"
                placeholder="adminname"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#0c0c0e",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  padding: "11px 14px",
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  color: "#f4f4f5",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#52525b",
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <input
                className="al-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#0c0c0e",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  padding: "11px 14px",
                  fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                  color: "#f4f4f5",
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  fontSize: 12,
                  color: "#f87171",
                  background: "rgba(248,113,113,0.08)",
                  border: "0.5px solid rgba(248,113,113,0.2)",
                  borderRadius: 8,
                  padding: "9px 12px",
                  marginBottom: "1.25rem",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              className="al-btn"
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: "#6366f1",
                border: "none",
                borderRadius: 10,
                padding: "12px",
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.01em",
                opacity: loading ? 0.4 : 1,
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              height: "0.5px",
              background: "rgba(255,255,255,0.06)",
              margin: "1.5rem 0 1.25rem",
            }}
          />
          <div
            style={{
              fontSize: 11,
              color: "#3f3f46",
              textAlign: "center",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            sys/admin &nbsp;·&nbsp; restricted access
          </div>
        </div>
      </div>
    </>
  );
}
